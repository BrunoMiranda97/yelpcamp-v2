# YelpCamp V2 🏕️

A modern full-stack campground marketplace inspired by the original YelpCamp project — rebuilt from scratch with a modern architecture, improved UI/UX, Docker support, cloud deployment, authentication, maps integration, and production-ready backend structure.

### Live Demo
https://yelpcamp-v2-eight.vercel.app/

### Previous Version (V1)
https://github.com/BrunoMiranda97/yelpcamp-v1

---

## Why V2?

My original YelpCamp project was built while learning backend fundamentals.

This second version was rebuilt to demonstrate:

- cleaner architecture
- modern frontend design
- improved scalability
- API separation
- cloud deployment
- Docker support
- better authentication flow
- production readiness

This project represents my growth as a developer.

---

# Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Lucide Icons

### Backend
- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcrypt

### Infrastructure / DevOps
- Docker
- Docker Compose
- Vercel
- Cloudinary
- Mapbox

---

# Features

### Authentication
- User registration
- Login/logout
- JWT authentication
- Protected routes
- Persistent sessions

### Campgrounds
- Create campgrounds
- View all campgrounds
- Pagination
- Campground details
- Delete campgrounds
- Edit campgrounds

### Reviews
- Create reviews
- Delete reviews
- Ratings system

### Maps
- Interactive Mapbox integration
- Geolocation display

### Image Upload
- Cloudinary image hosting

### Security
- Helmet
- Rate limiting
- Mongo sanitize
- Input validation

---

# Project Architecture

```bash
YelpCamp-V2/
│
├── api/
│   └── index.ts              # Vercel serverless entry
│
├── src/
│   ├── client/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── hooks/
│   │
│   └── server/
│       ├── config/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── utils/
│
├── app.ts
├── server.ts
├── Dockerfile
├── docker-compose.yml
├── vercel.json
└── package.json
```

---

# Local Installation

Clone repository:

```bash
git clone https://github.com/BrunoMiranda97/yelpcamp-v2.git
cd yelpcamp-v2
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```env
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

VITE_MAPBOX_TOKEN=your_mapbox_token
```

Run locally:

```bash
npm run dev
```

---

# Docker Setup

Build and run container:

```bash
docker compose up --build
```

Stop containers:

```bash
docker compose down
```

---

# Deployment

## GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/BrunoMiranda97/yelpcamp-v2.git
git push -u origin main
```

---

## Vercel

Deploy production build:

```bash
vercel --prod
```

Add environment variables inside Vercel dashboard:

- MONGODB_URI
- JWT_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_KEY
- CLOUDINARY_SECRET
- VITE_MAPBOX_TOKEN

---

# Lessons Learned

During V2 development I solved several real-world deployment problems:

- Docker build issues
- Vercel serverless routing issues
- MongoDB connection caching
- Environment variable handling
- API rewrites
- Production debugging
- Cloud deployment troubleshooting

This project taught me far more than simply building CRUD functionality.

---

# Author

**Bruno Miranda**

GitHub: https://github.com/BrunoMiranda97  
LinkedIn: https://www.linkedin.com/in/brunomiranda97/

---

# Final Note

This project intentionally remains public to showcase both:

- my original learning version (V1)
- my improved production-ready version (V2)

The contrast between both projects reflects my evolution as a software developer.
