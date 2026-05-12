
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '40px auto', padding: '30px' }}>
            <h1>Terms of Service</h1>

            <div className="terms-content" style={{ marginTop: '20px', lineHeight: '1.6', color: '#444' }}>
                <p><strong>Last Updated: January 2026</strong></p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>1. Introduction</h3>
                <p>Welcome to InteractYou (Communication Assessment Platform). By accessing our website and using our services, you agree to be bound by these Terms of Service.</p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>2. Use of Service</h3>
                <p>Our platform evaluates communication skills using AI analysis. You agree to use this service only for lawful purposes and in accordance with these Terms.</p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>3. Privacy</h3>
                <p>Your privacy is important to us. We collect and process data as described in our Privacy Policy. Video and audio data are processed for assessment purposes only.</p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>4. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>5. Modification</h3>
                <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
            </div>

            <button
                onClick={() => navigate(-1)}
                style={{
                    marginTop: '30px',
                    padding: '10px 20px',
                    backgroundColor: '#5d9cec',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Go Back
            </button>
        </div>
    );
};

export default Terms;
