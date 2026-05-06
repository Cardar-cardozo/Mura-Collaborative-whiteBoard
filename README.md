

# Mura Collaborative Whiteboard

Mura is a high-performance, real-time collaborative whiteboard application built for seamless remote teamwork. It features an infinite canvas, rich drawing tools, spatial audio, and instant synchronization.

## Features

- **Infinite Canvas**: Pan and zoom smoothly across an unlimited workspace.
- **Real-Time Collaboration**: See cursors and live drawing updates from other users in the room with zero perceived latency.
- **Rich Tools**:
  - **Pen & Eraser**: High-fidelity freehand drawing with customizable thickness and colors.
  - **Sticky Notes**: Draggable, editable, and rotatable text notes.
  - **Images**: Upload images directly to the board (Cloudinary integration) with beautiful Polaroid styling and aspect ratio controls.
  - **Ruler**: An interactive, draggable, and rotatable ruler for precise measurements.
- **Spatial Audio Collaboration**: Built-in WebRTC voice calls with spatial audio. Voice intensity and direction correspond to participant cursor positions on the board.
- **Mobile Guard**: A dedicated overlay ensuring the best experience by directing mobile users to desktop environments.

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Zustand (State Management)
- Framer Motion (Animations & Drag Logic)
- Tailwind CSS (Styling)
- Socket.io-client (Real-time events)

**Backend:**
- NestJS
- MongoDB + Mongoose
- Socket.io (Real-time Gateway)

## Running Locally

### Prerequisites
- Node.js (v18 or higher)
- A MongoDB instance
- A Cloudinary account (for image uploads)

### Environment Variables

Create a `.env` file in the frontend directory with the following:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3001
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
```

Create a `.env` file in the backend directory with the following:

```env
MONGODB_URI=mongodb://localhost:27017/mura
PORT=3000
SOCKET_PORT=3001
```

### Installation

1. **Start the Backend:**
   ```bash
   cd Mura-back-end
   npm install
   npm run start:dev
   ```

2. **Start the Frontend:**
   ```bash
   cd Mura-Collaborative-whiteBoard
   npm install
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.
