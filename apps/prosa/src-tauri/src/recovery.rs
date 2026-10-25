use chrono::Utc;
use serde::{Deserialize, Serialize};

const RECOVERY_VERSION: u8 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryEnvelope {
    pub version: u8,
    pub captured_at: String,
    pub document_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryPayload {
    pub captured_at: String,
    pub document_json: String,
}

pub fn wrap_recovery(document_json: String) -> String {
    let captured_at = Utc::now().to_rfc3339();
    let envelope = RecoveryEnvelope {
        version: RECOVERY_VERSION,
        captured_at,
        document_json: document_json.clone(),
    };
    serde_json::to_string_pretty(&envelope).unwrap_or(document_json)
}

pub fn parse_recovery(raw: &str) -> RecoveryPayload {
    if let Ok(envelope) = serde_json::from_str::<RecoveryEnvelope>(raw) {
        if envelope.version == RECOVERY_VERSION {
            return RecoveryPayload {
                captured_at: envelope.captured_at,
                document_json: envelope.document_json,
            };
        }
    }
    RecoveryPayload {
        captured_at: Utc::now().to_rfc3339(),
        document_json: raw.to_string(),
    }
}
