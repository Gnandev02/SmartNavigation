# SmartNav

SmartNav is an AI Voice Navigation Assistant platform for visually impaired users.

## Features
- Real-Time Obstacle Detection
- Signboard Reading
- Voice Navigation
- Emergency SOS
- Admin Dashboard

## Architecture
- **Frontend**: Vanilla HTML/CSS/JS focusing on accessibility
- **Backend**: FastAPI with PostgreSQL
- **AI**: YOLOv8, OpenCV, EasyOCR

## Setup Instructions
1. Clone this repository.
2. Copy `.env.example` to `.env` and configure your variables.
3. Run `docker-compose up --build`
4. Access the frontend at `http://localhost:80` and the API at `http://localhost:8000`.

## Accessibility
The entire platform is built adhering to WCAG 2.2 AA standards, ensuring full screen reader compatibility and keyboard navigation.
