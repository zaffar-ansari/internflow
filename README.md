# 🚀 Intern~Flow
### *Empowering Interns, Streamlining Workflows.*

🔗 **Live App:** [internflow-arova.netlify.app](https://internflow-arova.netlify.app)

---

**Intern~Flow** is a modern productivity and engagement platform designed to bridge the gap between interns and management. It provides a seamless way for interns to track their daily progress, while offering admins a birds-eye view of team productivity and project health.

---

## ✨ Key Features

### 👤 For Interns
- **📝 Daily Log Submission:** Quick and easy reporting of tasks, accomplishments, and blockers.
- **📊 Productivity Analytics:** Visualize your working hours and productivity trends in real-time.
- **🔥 Logging Streaks:** Stay motivated with daily streaks and activity tracking.
- **🌈 Mood Tracking:** Reflect your daily workspace mood with intuitive sentiment logging.
- **📁 Project Insights:** View assigned projects and keep track of your workload.

### 🛡️ For Admins
- **🔍 Global Dashboard:** Monitor the entire team's productivity and mood trends at a glance.
- **👥 Intern Management:** Access detailed profiles and historical work logs for every intern.
- **📌 Project Assignment:** Assign and manage tasks efficiently.
- **📉 Data Export:** One-click CSV export for all logs and performance records.
- **🛠️ Automated Insights:** Identify blockers and low-productivity trends before they become issues.

---

## 🛠️ Tech Stack

Intern~Flow is built on top of a cutting-edge tech stack for speed, reliability, and modern aesthetics:

- **Frontend:** [React.js](https://reactjs.org/) (Vite)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Glassmorphism UI)
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL + Realtime)
- **Charts:** [Recharts](https://recharts.org/) (Interactive Data Visualization)
- **Icons:** [Lucide React](https://lucide.dev/)
- **State Management:** React Context API
- **Authentication:** Supabase Auth (Email/Password)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v16.x or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/sxmxd-code/Intern-Flow.git
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Start the development server:**
   ```sh
   npm run dev
   ```

---

## 📁 Project Structure

```text
├── src/
│   ├── components/       # Reusable UI & Layout components
│   │   ├── charts/       # Recharts implementations
│   │   ├── layout/       # Sidebar, PageHeader, etc.
│   │   └── ui/           # Buttons, Inputs, GlassCards
│   ├── context/          # Auth & State Contexts
│   ├── lib/              # Supabase & External Lib configs
│   ├── pages/            # Application Screens (Admin & Intern)
│   ├── utils/            # Helper functions (calculateScore, etc.)
│   └── App.jsx           # Main App entry with Routing
├── public/               # Static assets
└── index.css             # Global styling & Tailwind directives
```

---

## 🎨 UI/UX Design

Intern~Flow features a **Signature Glassmorphism UI** with:
- ✨ **Fluent Animations:** Smooth transitions and micro-interactions.
- 🌓 **Dynamic Backgrounds:** Responsive radial gradients and floating blobs for depth.
- 📱 **Mobile First:** Fully responsive across all devices and screen sizes.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

### 📬 Contact
**Sxmxd Code** - [GitHub](https://github.com/sxmxd-code)  
Project Link: [https://github.com/sxmxd-code/Intern-Flow](https://github.com/sxmxd-code/Intern-Flow)

**Developed with ❤️ for Arova Technologies**
