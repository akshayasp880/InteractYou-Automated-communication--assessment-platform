@echo off

:: Step 1: Open a new terminal and activate the Conda environment for the backend
start cmd /k "conda activate InteractYou && cd C:\Users\adity\OneDrive\Desktop\Aditya\Final Yr Project\Aditya's Final Year Project\Aditya's Final Year Project\InteractYou\server && python app.py"

:: Step 2: Open another terminal and navigate to the client directory and run the React app
start cmd /k "cd C:\Users\adity\OneDrive\Desktop\Aditya\Final Yr Project\Aditya's Final Year Project\Aditya's Final Year Project\InteractYou/client && npm run dev"

:: Step 3: Wait for 6 seconds
timeout /t 6 /nobreak

:: Step 4: Open the browser and navigate to the frontend URL
start http://localhost:5173/

:: End
echo All processes are started. Browser should open shortly.
pause
