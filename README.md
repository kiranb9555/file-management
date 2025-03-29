

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- On Windows PowerShell:
```powershell
.\venv\Scripts\activate
``

3. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations users
python manage.py makemigrations files
python manage.py migrate
```

5. Start the development server:
python manage.py runserver 5000
```bash
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm start
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

## API Documentation

The API endpoints will be available at `http://localhost:5000/api/` 