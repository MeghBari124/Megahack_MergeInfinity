import os
from twilio.rest import Client
from typing import Optional

class TwilioService:
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if self.account_sid and self.auth_token and self.from_number:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                print("? Twilio Client Initialized.")
            except Exception as e:
                print(f"? Twilio Init Error: {e}")
                self.client = None
        else:
            print("?? Twilio credentials missing. SMS service inactive.")
            self.client = None

    def send_sms(self, to_number: str, message_body: str) -> bool:
        """
        Sends an SMS to the specified number.
        Returns True if successful, False otherwise.
        """
        if not self.client:
            print(f"Skipping SMS to {to_number}: Twilio not configured.")
            return False

        try:
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=to_number
            )
            print(f"SMS sent to {to_number}: {message.sid}")
            return True
        except Exception as e:
            print(f"? Failed to send SMS: {e}")
            return False

# Singleton instance
sms_service = TwilioService()

def send_feature_notification(user_phone: str, feature_name: str, details: str):
    """
    Helper to standardize feature notifications.
    """
    msg = f"Annadata Saathi Alert [{feature_name}]: {details}"
    return sms_service.send_sms(user_phone, msg)
