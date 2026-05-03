import cv2
import numpy as np
import time
import mediapipe as mp
import threading
from collections import deque

# ========== ORIGINAL STRICT HYPERPARAMETERS ==========
SHOULDER_DIFF_DEADZONE = 0.06
EYES_CLOSED_THRESHOLD = 1.0
MOUTH_OPEN_THRESHOLD = 0.03
HEAD_TILT_THRESHOLD = 16

# STRICT eye contact thresholds
HORIZONTAL_RANGE = (0.42, 0.58)
VERTICAL_RANGE = (0.38, 0.62)
HEAD_OFFSET_MAX = 0.15
# ====================================================

# NO smoothing
SMOOTHING_WINDOW = 1
MIN_BUFFER_SIZE = 1

# Haar Cascades
FACE_CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
EYE_CASCADE_PATH = cv2.data.haarcascades + 'haarcascade_eye.xml'

face_cascade = cv2.CascadeClassifier(FACE_CASCADE_PATH)
eye_cascade = cv2.CascadeClassifier(EYE_CASCADE_PATH)

# MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=False,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

local_eye_state = threading.local()


def _init_smoothing_buffer():
    if not hasattr(local_eye_state, 'gaze_buffer'):
        local_eye_state.gaze_buffer = deque(maxlen=SMOOTHING_WINDOW)
        local_eye_state.closed_since = None
        local_eye_state.detection_failures = 0


def _detect_pupil_position(eye_frame):
    """Detect pupil position."""
    if eye_frame.shape[0] < 10 or eye_frame.shape[1] < 10:
        return None

    try:
        if len(eye_frame.shape) == 3:
            gray_eye = cv2.cvtColor(eye_frame, cv2.COLOR_BGR2GRAY)
        else:
            gray_eye = eye_frame

        gray_eye = cv2.equalizeHist(gray_eye)
        gray_eye = cv2.GaussianBlur(gray_eye, (5, 5), 0)

        threshold_eye = cv2.adaptiveThreshold(
            gray_eye, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 11, 2
        )

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        threshold_eye = cv2.morphologyEx(threshold_eye, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(threshold_eye, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return None

        valid_contours = [c for c in contours if 20 < cv2.contourArea(c) < 1000]
        if not valid_contours:
            return None

        pupil_contour = max(valid_contours, key=cv2.contourArea)
        moments = cv2.moments(pupil_contour)

        if moments['m00'] == 0:
            return None

        pupil_x = int(moments['m10'] / moments['m00'])
        pupil_y = int(moments['m01'] / moments['m00'])

        height, width = eye_frame.shape[:2]
        x_ratio = pupil_x / width
        y_ratio = pupil_y / height

        if not (0 <= x_ratio <= 1 and 0 <= y_ratio <= 1):
            return None

        return x_ratio, y_ratio

    except Exception:
        return None


def _analyze_eyes_with_pupil_tracking(frame_gray, face_box, timestamp_str):
    """Track pupils - STRICT, NO FALLBACKS."""
    _init_smoothing_buffer()

    events = []
    fx, fy, fw, fh = face_box

    eye_region_y = fy + int(fh * 0.15)
    eye_region_h = int(fh * 0.4)
    eye_region = frame_gray[eye_region_y:eye_region_y + eye_region_h, fx:fx + fw]

    eyes = eye_cascade.detectMultiScale(
        eye_region,
        scaleFactor=1.1,
        minNeighbors=3,
        minSize=(15, 15)
    )

    # Eye closure tracking
    now = time.time()
    long_eyes_closed = False
    eyes_open = len(eyes) >= 1

    if not eyes_open:
        if local_eye_state.closed_since is None:
            local_eye_state.closed_since = now
        elif now - local_eye_state.closed_since > EYES_CLOSED_THRESHOLD:
            long_eyes_closed = True
            events.append({
                'timestamp': timestamp_str,
                'type': 'eyes_closed',
                'description': 'Eyes closed for too long',
            })
    else:
        local_eye_state.closed_since = None

    # Pupil tracking - STRICT
    eye_contact_good = False

    if eyes_open and len(eyes) > 0:
        pupil_positions = []

        for (ex, ey, ew, eh) in eyes[:2]:
            eye_frame = eye_region[ey:ey + eh, ex:ex + ew]
            pupil_pos = _detect_pupil_position(eye_frame)
            if pupil_pos is not None:
                pupil_positions.append(pupil_pos)

        if pupil_positions:
            local_eye_state.detection_failures = 0

            avg_x = np.mean([p[0] for p in pupil_positions])
            avg_y = np.mean([p[1] for p in pupil_positions])

            # STRICT thresholds
            h_min, h_max = HORIZONTAL_RANGE
            v_min, v_max = VERTICAL_RANGE

            horizontal_ok = h_min < avg_x < h_max
            vertical_ok = v_min < avg_y < v_max

            eye_contact_good = horizontal_ok and vertical_ok
        else:
            eye_contact_good = False
    else:
        eye_contact_good = False

    return eye_contact_good, long_eyes_closed, events


def _get_face_landmarks(frame_rgb):
    results = face_mesh.process(frame_rgb)
    if not results.multi_face_landmarks:
        return None
    return results.multi_face_landmarks[0].landmark


def compute_posture_and_engagement(
        kpts, frame_w, frame_h, frame_gray, frame_rgb, elapsed_time
):
    """
    Returns: posture_label, engagement_label, reasons, events, eye_contact_good, hands_visible, is_gesturing
    """
    NOSE, LEFT_SHOULDER, RIGHT_SHOULDER = 0, 5, 6
    LEFT_WRIST, RIGHT_WRIST = 9, 10
    LEFT_EAR, RIGHT_EAR = 3, 4

    ls, rs = kpts[LEFT_SHOULDER], kpts[RIGHT_SHOULDER]
    lw, rw = kpts[LEFT_WRIST], kpts[RIGHT_WRIST]
    nose = kpts[NOSE]
    leftear = kpts[LEFT_EAR] if len(kpts) > LEFT_EAR else None
    rightear = kpts[RIGHT_EAR] if len(kpts) > RIGHT_EAR else None

    # Define additional keypoints
    LEFT_ELBOW, RIGHT_ELBOW = 7, 8
    le, re = kpts[LEFT_ELBOW], kpts[RIGHT_ELBOW]

    posture_reasons = []
    engagement_reasons = []
    events = []
    timestamp_str = time.strftime('%M:%S', time.gmtime(elapsed_time))

    # 1. Shoulders
    shoulder_diff_y = abs(ls[1] - rs[1]) / frame_h
    shoulder_ok = shoulder_diff_y < SHOULDER_DIFF_DEADZONE
    if not shoulder_ok:
        side = "Left shoulder higher than right" if ls[1] < rs[1] else "Right shoulder higher than left"
        posture_reasons.append(side + ".")
        events.append({'timestamp': timestamp_str, 'type': 'shoulder_misalignment', 'description': side})

    # 2. Head tilt
    neck_x, neck_y = (ls[0] + rs[0]) / 2, (ls[1] + rs[1]) / 2
    if leftear is not None and rightear is not None:
        head_x, head_y = (leftear[0] + rightear[0]) / 2, (leftear[1] + rightear[1]) / 2
    else:
        head_x, head_y = nose[0], nose[1]

    dx, dy = head_x - neck_x, head_y - neck_y
    head_tilt_ok = True
    if abs(dx) > 1 and abs(dy) > 1:
        angle = np.degrees(np.arctan2(dy, dx))
        if abs(abs(angle) - 90) > HEAD_TILT_THRESHOLD:
            direction = "right" if angle < -90 else "left"
            desc = f"Head tilted {direction}"
            posture_reasons.append(desc + ".")
            events.append({'timestamp': timestamp_str, 'type': 'head_tilt', 'description': desc})
            head_tilt_ok = False

    # 3. Hands too high
    avg_sh_y = (ls[1] + rs[1]) / 2
    
    # Check if wrists are actually detected (y > 0) and are above the threshold
    # Threshold 0.45 * frame_h above shoulders means very high up near head
    left_hand_high = (lw[1] > 0) and (lw[1] < avg_sh_y - 0.45 * frame_h)
    right_hand_high = (rw[1] > 0) and (rw[1] < avg_sh_y - 0.45 * frame_h)
    
    hands_too_high = left_hand_high or right_hand_high
    if hands_too_high:
        desc = "Hands very high (over-gesturing)"
        posture_reasons.append(desc + ".")
        events.append({'timestamp': timestamp_str, 'type': 'hand_gesture', 'description': desc})
    # Hands considered visible if wrists OR elbows are detected
    hands_visible = (lw[0] > 0 and lw[1] > 0) or (rw[0] > 0 and rw[1] > 0) or \
                    (le[0] > 0 and le[1] > 0) or (re[0] > 0 and re[1] > 0)

    if not hasattr(local_eye_state, 'prev_left_wrist'):
        local_eye_state.prev_left_wrist = None
        local_eye_state.prev_right_wrist = None
        local_eye_state.prev_left_elbow = None
        local_eye_state.prev_right_elbow = None
        local_eye_state.last_gesture_time = time.time()
        print("🔧 Gesture tracking initialized (Wrists + Elbows)")

    is_gesturing = False

    if hands_visible:
        current_time = time.time()
        total_movement = 0

        # Helper to calculate movement
        def get_move(curr, prev):
            if curr[0] > 0 and curr[1] > 0 and prev is not None:
                dx = curr[0] - prev[0]
                dy = curr[1] - prev[1]
                return np.sqrt(dx * dx + dy * dy)
            return 0

        # Track Left structure
        if lw[0] > 0 and lw[1] > 0:
            total_movement = max(total_movement, get_move(lw, local_eye_state.prev_left_wrist))
            local_eye_state.prev_left_wrist = (lw[0], lw[1])
        
        if le[0] > 0 and le[1] > 0:
            total_movement = max(total_movement, get_move(le, local_eye_state.prev_left_elbow))
            local_eye_state.prev_left_elbow = (le[0], le[1])

        # Track Right structure
        if rw[0] > 0 and rw[1] > 0:
            total_movement = max(total_movement, get_move(rw, local_eye_state.prev_right_wrist))
            local_eye_state.prev_right_wrist = (rw[0], rw[1])
            
        if re[0] > 0 and re[1] > 0:
            total_movement = max(total_movement, get_move(re, local_eye_state.prev_right_elbow))
            local_eye_state.prev_right_elbow = (re[0], re[1])

        # Sensitivity check: 3.0px threshold
        if total_movement > 3.0:
            is_gesturing = True
            local_eye_state.last_gesture_time = current_time
            print(f"✅ GESTURE DETECTED! Movement: {total_movement:.1f}px")
            
            
    # REMOVED: Aggressive reset of previous positions.
    # This ensures that if detection flickers (lost for 1-2 frames), we don't lose the movement history.
    # The state will naturally update when hands are detected again.

    # 5. Head offset
    torso_center_x = (ls[0] + rs[0]) / 2
    head_offset_x = abs(nose[0] - torso_center_x) / frame_w

    if head_offset_x > 0.25:
        engagement_label = "Engagement: Turned sideways"
        desc = "Not facing the camera"
        engagement_reasons.append(desc + ".")
        events.append({'timestamp': timestamp_str, 'type': 'engagement_sideways', 'description': desc})
    elif head_offset_x > 0.10:
        engagement_label = "Engagement: Partially turned"
        desc = "Head shifted to one side"
        engagement_reasons.append(desc + ".")
        events.append({'timestamp': timestamp_str, 'type': 'engagement_partial', 'description': desc})
    else:
        engagement_label = "Engagement: Facing camera"

    # 6. Eye tracking
    long_eyes_closed = False
    eye_contact_good = False

    faces = face_cascade.detectMultiScale(frame_gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))

    if len(faces) > 0 and head_offset_x <= HEAD_OFFSET_MAX:
        face_box = faces[0]
        eye_contact_good, long_eyes_closed, eye_events = _analyze_eyes_with_pupil_tracking(
            frame_gray, face_box, timestamp_str
        )
        events.extend(eye_events)
    else:
        eye_contact_good = False

    if long_eyes_closed:
        posture_reasons.append("Eyes closed for too long.")

    # 7. Mouth
    landmarks = _get_face_landmarks(frame_rgb)
    mouth_wide_open = False

    if landmarks is not None:
        mouth_dist = abs(landmarks[13].y - landmarks[14].y)
        mouth_wide_open = mouth_dist > MOUTH_OPEN_THRESHOLD
        if mouth_wide_open:
            desc = "Mouth appears wide open"
            posture_reasons.append(desc + ".")
            events.append({'timestamp': timestamp_str, 'type': 'mouth_open', 'description': desc})

    # ========== ORIGINAL SIMPLE POSTURE LOGIC ==========
    issues = 0
    if not shoulder_ok:
        issues += 1
    if hands_too_high:
        issues += 1
    if long_eyes_closed:
        issues += 1
    if mouth_wide_open:
        issues += 1
    if not head_tilt_ok:
        issues += 1

    if issues == 0:
        posture_label = "Good Posture"
    elif issues <= 3:
        posture_label = "Mostly Good Posture"
    else:
        posture_label = "Bad Posture"
    # ===================================================

    if not posture_reasons:
        posture_reasons = ["Overall body posture looks comfortable."]

    return (
        posture_label,
        engagement_label,
        posture_reasons,
        engagement_reasons,
        events,
        eye_contact_good,
        hands_visible,
        is_gesturing,
    )
