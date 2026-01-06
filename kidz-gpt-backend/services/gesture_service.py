"""
Gesture Detection Service using MediaPipe
Handles real-time hand gesture recognition for zoom control
"""

import base64
import io
from typing import Dict, Any, Optional
import cv2
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import mediapipe as mp
import os

# Singleton instance for gesture recognizer
_gesture_recognizer: Optional[vision.GestureRecognizer] = None

def initialize_gesture_recognizer():
    """Initialize MediaPipe Gesture Recognizer"""
    global _gesture_recognizer
    
    if _gesture_recognizer is not None:
        return _gesture_recognizer
    
    try:
        # Download the gesture recognizer model if not present
        import urllib.request
        model_path = "gesture_recognizer.task"
        
        if not os.path.exists(model_path):
            print("📥 Downloading gesture recognizer model...")
            model_url = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task"
            urllib.request.urlretrieve(model_url, model_path)
            print(f"✅ Model downloaded to {model_path}")
        
        # Create base options with the model file
        base_options = python.BaseOptions(model_asset_path=model_path)
        
        options = vision.GestureRecognizerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,  # Only detect 1 hand as per requirements
            min_hand_detection_confidence=0.7,  # 70% minimum confidence
            min_hand_presence_confidence=0.7,
            min_tracking_confidence=0.7
        )
        
        _gesture_recognizer = vision.GestureRecognizer.create_from_options(options)
        print("✅ Gesture Recognizer initialized successfully")
        return _gesture_recognizer
    except Exception as e:
        print(f"❌ Failed to initialize Gesture Recognizer: {e}")
        raise


def decode_frame_from_base64(frame_b64: str) -> Optional[np.ndarray]:
    """
    Decode a base64-encoded image frame to numpy array
    
    Args:
        frame_b64: Base64-encoded image string
        
    Returns:
        numpy array of image or None if decoding fails
    """
    try:
        # Remove data URL prefix if present
        if "," in frame_b64:
            frame_b64 = frame_b64.split(",")[1]
        
        # Decode base64
        frame_data = base64.b64decode(frame_b64)
        
        # Convert to numpy array
        nparr = np.frombuffer(frame_data, np.uint8)
        
        # Decode image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
            
        # Convert BGR to RGB for MediaPipe
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        return img_rgb
    except Exception as e:
        print(f"❌ Error decoding frame: {e}")
        return None


def detect_gesture(frame_b64: str) -> Dict[str, Any]:
    """
    Detect hand gesture from a base64-encoded frame
    
    Returns zoom action based on gesture:
    - Open Palm → "zoom_out" (decrease zoom)
    - Closed Fist → "zoom_in" (increase zoom)
    - Pinch → "zoom_in" (increase zoom)
    
    Args:
        frame_b64: Base64-encoded image frame from frontend camera
        
    Returns:
        Dictionary with gesture detection results:
        {
            "zoom_action": "zoom_in" | "zoom_out" | null,
            "gesture": "open_palm" | "closed_fist" | "pinch" | null,
            "confidence": 0.85,  # 0-1 range
            "hand_detected": True,
            "hand_count": 1,
            "error": None | "error message"
        }
    """
    try:
        # Initialize recognizer if needed
        recognizer = initialize_gesture_recognizer()
        
        # Decode frame
        img_rgb = decode_frame_from_base64(frame_b64)
        if img_rgb is None:
            return {
                "zoom_action": None,
                "gesture": None,
                "confidence": 0,
                "hand_detected": False,
                "hand_count": 0,
                "error": "Failed to decode frame"
            }
        
        # Create MediaPipe Image using the correct API
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        # Run gesture recognition
        recognition_result = recognizer.recognize(mp_image)
        
        # Process results
        hand_count = len(recognition_result.hand_landmarks) if recognition_result.hand_landmarks else 0
        
        # Log detection attempt
        print(f"🖼️ Gesture detection: hands detected = {hand_count}")
        
        # Check if gestures detected
        if (recognition_result.gestures and 
            len(recognition_result.gestures) > 0 and 
            len(recognition_result.gestures[0]) > 0):
            
            # Get primary gesture
            primary_gesture = recognition_result.gestures[0][0]
            gesture_name = primary_gesture.category_name
            confidence = primary_gesture.score
            
            # Normalize gesture name to snake_case
            normalized_gesture = gesture_name.lower().replace(" ", "_").replace("-", "_")
            
            # Determine zoom action based on gesture
            zoom_action = None
            
            if normalized_gesture == "open_palm":
                zoom_action = "zoom_in"
                print(f"✋ Open palm detected (confidence: {confidence:.1%}) → ZOOM IN")
            elif normalized_gesture == "closed_fist":
                zoom_action = "zoom_out"
                print(f"✊ Closed fist detected (confidence: {confidence:.1%}) → ZOOM OUT")
            elif normalized_gesture == "pinch" or normalized_gesture == "pinch_major":
                zoom_action = "zoom_in"
                print(f"🤏 Pinch detected (confidence: {confidence:.1%}) → ZOOM IN")
            
            # Log detected gesture
            print(f"👉 Gesture detected: {gesture_name} (confidence: {confidence:.1%})")
            
            return {
                "zoom_action": zoom_action,
                "gesture": normalized_gesture,
                "confidence": float(confidence),
                "hand_detected": True,
                "hand_count": hand_count,
                "error": None
            }
        else:
            # No gesture detected - keep current zoom level
            print(f"⚠️ No gesture detected (hand_count: {hand_count})")
            return {
                "zoom_action": None,
                "gesture": None,
                "confidence": 0,
                "hand_detected": hand_count > 0,
                "hand_count": hand_count,
                "error": None
            }
    
    except Exception as e:
        error_msg = f"Gesture detection error: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "zoom_action": None,
            "gesture": None,
            "confidence": 0,
            "hand_detected": False,
            "hand_count": 0,
            "error": error_msg
        }
