import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import os

# Define paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "classifier.joblib")

def generate_mock_data(n_samples=2000):
    """
    Generate synthetic data for TOMA classification.
    Features: [Jaccard, Dice, Cosine, LevDist, LevRatio, Jaro]
    Labels: 1 (Clone), 0 (Non-Clone)
    """
    np.random.seed(42)
    
    # Type-3 Clones: High similarity (0.6 - 1.0)
    clones = np.random.uniform(0.6, 1.0, (n_samples // 2, 6))
    
    # Hard Non-Clones: Moderate similarity (0.3 - 0.7) - slightly overlapping
    non_clones = np.random.uniform(0.0, 0.5, (n_samples // 2, 6))
    
    # Add some noise/exceptions
    # E.g., non-clones with high cosine but low levenshtein
    non_clones[:100, 2] = np.random.uniform(0.7, 0.9, 100) 
    
    X = np.vstack([clones, non_clones])
    y = np.hstack([np.ones(n_samples // 2), np.zeros(n_samples // 2)])
    
    return X, y

def train_classifier():
    print("Generating mock data (Type-3 Clones & Hard Non-Clones)...")
    X, y = generate_mock_data()
    
    print(f"Dataset shape: {X.shape}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    
    # Ensure model directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(clf, MODEL_PATH)
    print("Done.")

if __name__ == "__main__":
    train_classifier()
