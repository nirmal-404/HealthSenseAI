AI Symptom Checker Service (Optional Enhancement)
Responsibilities: Provide preliminary health suggestions based on symptoms.
Models:

SymptomCheck

checkId (UUID)
patientId (FK)
symptoms (array)
severity (mild, moderate, severe)
duration
aiSuggestions (text)
recommendedSpecialties (array)
urgencyLevel (low, medium, high)
createdAt


Symptom

symptomId (UUID)
name
category
keywords (array)



Functionalities:

Accept symptom inputs from patients
Process symptoms through AI/ML model
Provide preliminary health suggestions
Recommend appropriate doctor specialties
Determine urgency level
Store symptom check history
Integrate with external AI APIs (OpenAI, custom models)

API Endpoints:

POST /api/ai/symptom-check
GET /api/ai/symptom-check/{checkId}
GET /api/ai/symptom-check/history/{patientId}
GET /api/ai/symptoms/suggestions

