from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to SmartNav API"}

def test_admin_metrics_unauthorized():
    # Attempting to access admin without token should fail or return unauthorized
    response = client.get("/api/v1/admin/metrics")
    # Expected 401 because get_current_active_user dependency will fail without token
    assert response.status_code == 401
