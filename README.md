KalaSetu: Empowering Artisans, Enabling Green Fashion
=====================================================

👥 Group Members
----------------

*   **Nishant Khatri** (IMT2023009)
    
*   **Manav Jindal** (IMT2023535)
    
*   **Siddharth Goswami** (IMT2023542)
    
*   **Arshbir Singh Dang** (IMT2023132)
    

📖 Project Overview
-------------------

**KalaSetu** is a web-based ecosystem designed to bridge the gap between traditional artisans and the modern digital economy1. The platform addresses the challenges of market access, product viability, and funding by integrating three core pillars:

1.  **AI-Driven Ideation:** A tool that helps artisans generate localized, market-ready product ideas and visual mockups based on their specific skills and materials2.
    
2.  **Mentor Verification Workflow:** A structured quality gate where expert mentors review and verify artisan businesses and product concepts before they go public3.
    
3.  **Investor Marketplace:** A dedicated channel for artisans to pitch verified ideas to impact investors and secure funding for sustainable growth4.
    

### 🛠️ Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS, ShadCN UI5.
    
*   **Backend:** Python (Flask), Serverless Architecture6.
    
*   **Database:** Firebase / Firestore7.
    
*   **AI Integration:** External LLM and Image Generation APIs for product ideation8.
    

⚙️ Setup & Configuration
------------------------

### Prerequisites

*   Node.js (v18 or higher)
    
*   Python (v3.11 or higher)
    

### 🔑 Configuration (Important)

This project requires specific API keys and credentials to function (CohereAPI, HuggingFace & Firebase). Per course instructions, these sensitive files have been **sent via email** to the Teaching Assistants.

**Action Required:**

1.  Locate the **.env** file and **firebase-credentials.json** file attached to our submission email.
    
2.  Place **both files** directly into the backend/ directory of this project.
    

### 1\. Backend Setup

Navigate to the backend directory and install dependencies.

```Bash
cd backend  
# Create virtual environment (Optional but recommended)  
python -m venv venv  
# Windows: venv\Scripts\activate  
# Mac/Linux: source venv/bin/activate 

# Install requirements  
pip install -r requirements.txt
```

### 2\. Frontend Setup

Navigate to the frontend directory and install Node modules.

```Bash
cd frontend  
npm install
```

🚀 How to Run the Project
-------------------------

### Start the Backend Server

```
Bash
cd backend
python app.py
```

_The server will start on http://127.0.0.1:5000_

### Start the Frontend Application

```Bash
cd frontend
npm run dev
```

_Access the application at http://localhost:8080_

🧪 Testing Procedure
--------------------

We have implemented automated integration tests for the backend logic to ensure the stability of core features. These tests mock external services to ensure reliability and speed.

### Backend Verification (Python)

**Command:**

```Bash
cd backend
pytest -s test_app.py
```

Expected Output:

You should see 36 passing tests. The -s flag enables verbose output, verifying Success, Validation Error, and State Logic for the following features:

**1.02: Profile Management**

Profile updates (skills/expertise) and data persistence.

**2.01: AI Ideation**

Generation of business ideas based on artisan profile prompts.

**3.01: Business Creation**

Registration of new businesses and linking to artisan profiles.

**3.02: Mentorship Connection**

Sending requests and managing the pending request queue.

**3.03: Mentor Verification**

Review workflow and status updates (Pending -> Verified).

**4.01: Pitch Creation**

Creation of investment pitches linked to verified businesses.

**4.02: Marketplace Discovery**

Retrieval and filtering of "open" investment pitches.

**4.03: Investment & Funding**

Processing funding amounts and updating pitch progress.

**5.01: Community Forum**

Creating posts, validating user IDs, and post persistence.

**5.03: Collaboration**

Sending collaboration requests and updating acceptance status.

**5.04: Direct Chat**

Sending messages and retrieving conversation history20.

_\>_ _**Note:**_ _Frontend testing has been excluded from this deliverables package as per TA instructions._
