# 📢 CitiVoice

**CitiVoice** is a comprehensive community management and reporting platform designed to bridge the gap between citizens and local government administrators. Specifically tailored for City Governments, it enables real-time reporting of concerns, efficient event management, and data-driven insights.

---

## 🚀 Key Features

### 🏢 Admin Dashboard (Web)
*   **Dynamic Barangay Management**: Admins can add, edit, and manage local barangays which instantly sync with the mobile registration system.
*   **Concerns Analytics**: Visualized reports showing top-reporting areas and category breakdowns.
*   **Premium Map View**: A dark-mode, high-performance map using Leaflet for geocoding and location tracking.
*   **Announcements & Events**: Specialized tools to broadcast urgent info or community gatherings with specific category icons.
*   **Verification Gate**: A review system for approving citizen registrations based on government IDs.

### 📱 Citizen App (Mobile)
*   **Easy Registration**: Modern signup flow with dynamic barangay selection.
*   **Quick Reporting**: Submit community concerns (Roads, Waste, Safety) with location markers.
*   **Live Updates**: Real-time access to city announcements and local events.
*   **Identity Verification**: Integrated flow for submitting verification documents.

---

## 🛠️ Tech Stack

*   **Frontend (Web)**: React.js, React Router, CSS Modules, Lucide/Ionicons.
*   **Mobile**: React Native, Expo, React Navigation.
*   **Database, Auth & Backend**: Custom MySQL Database with an Express.js (Node.js) REST API, using JSON Web Tokens (JWT) for authentication.
*   **Mapping**: Leaflet.js, OpenStreetMap, Leaflet-GeoSearch.
*   **Design**: Custom-built premium glassmorphism design system.

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server (running locally or remote)
- Expo Go (for mobile testing)

### ⚙️ Setting up the Backend API
The backend provides REST API endpoints for both the admin web app and the mobile application.
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=citivoice
   JWT_SECRET=citivoice_jwt_secret_key_2024
   BASE_URL=http://localhost:5000
   ```
4. Configure your MySQL database:
   Create a schema named `citivoice` in your MySQL server. Ensure the credentials in your `.env` match your MySQL setup.
5. Start the development server:
   ```bash
   npm run dev
   ```

### 🖥️ Running the Admin Portal
1. Navigate to the web directory:
   ```bash
   cd admin-web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

### 📱 Running the Mobile App
1. Navigate to the mobile directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo server:
   ```bash
   npx expo start
   ```

---

## 🔒 Security
The project utilizes **JWT-based Authentication and Authorization** over a custom REST API. Routes are protected via middleware to ensure that sensitive endpoints (like managing users or resolving concerns) are only accessible to verified administrators or the authenticated owners of the data. Additionally, an administrative approval process controls new user registrations.
