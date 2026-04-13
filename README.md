🚍 Smart Bus Surveillance & Ticket Integrity System

A modern, responsive web-based simulation of a smart public transport system that integrates ticket booking, QR-based validation, fare calculation, and surveillance monitoring.

This project demonstrates how digital systems can improve efficiency, transparency, and security in public transportation.

✨ Features
🚍 Core Functionalities
1. Bus Stop Selection
Select starting and destination stops from predefined locations
Prevents invalid route selections
2. Fare Calculation
Automatic fare calculation based on number of stops traveled
Dynamic and real-time updates
3. Bus Assignment System
Displays available buses for the selected route
Shows:
Bus number
Available seats (simulated live)
Automatically assigns a bus upon booking
4. Seat Allocation Logic
Dynamically assigns seats
Special condition:
Female passengers are assigned seats next to other female passengers (simulated logic)
5. QR-Based Ticket Generation
Generates a digital ticket with QR code
QR contains:
Route (Start → Destination)
Bus number
Seat number
Fare amount
6. Payment Simulation
Generates a payment QR code
Simulates:
Payment success
Payment failure
Booking is confirmed only after successful payment
7. Ticket Display
Final ticket view includes:
QR code
Bus number
Seat number
Fare
Selected stops
🛡️ Surveillance System
1. Monitoring Dashboard
Displays:
Active buses
Passenger count
Seat occupancy
2. Fraud Detection System
Detects duplicate QR scans
Shows "Invalid Ticket" if scanned more than once
🎨 UI/UX Design
Modern glassmorphism-inspired UI
Fully responsive (mobile + desktop)
Smooth animations and transitions
Dashboard-style layout for surveillance system
🛠️ Tech Stack
Frontend:
HTML5
CSS3
JavaScript (Vanilla)
Libraries Used:
QR Code generation library (e.g., qrcode.js)
Backend:
Not required (uses dummy/simulated data)
📁 Project Structure
smart-bus-system/
│
├── index.html      # Main structure
├── styles.css      # Styling and responsiveness
├── script.js       # Logic and interactivity
└── README.md       # Project documentation# Smart-Bus-Surveillance-System
