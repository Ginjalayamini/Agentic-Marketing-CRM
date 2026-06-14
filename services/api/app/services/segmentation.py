import re


KNOWN_CITIES = ["Hyderabad", "Bengaluru", "Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Ahmedabad"]


def prompt_to_filter(prompt: str) -> dict:
    text = prompt.lower()
    logic: dict = {}

    spend_match = re.search(r"(?:spent|spend|more than|above|over)\s+(?:rs\.?|inr|rupees)?\s*(\d+)", text)
    if spend_match:
        logic["min_total_spent"] = int(spend_match.group(1))

    inactive_match = re.search(r"(?:inactive|haven'?t ordered|not ordered|last purchase).*?(\d+)\s*days?", text)
    if inactive_match:
        logic["inactive_days"] = int(inactive_match.group(1))
    elif "inactive" in text or "winback" in text or "bring back" in text:
        logic["inactive_days"] = 60

    for city in KNOWN_CITIES:
        if city.lower() in text:
            logic["city"] = city
            break

    top_match = re.search(r"top\s+(\d+)\s*%", text)
    if top_match:
        logic["top_percent"] = int(top_match.group(1))

    if not logic:
        logic = {"inactive_days": 60, "min_total_spent": 2000}

    return logic


def explain_filter(logic: dict) -> list[str]:
    reasons: list[str] = []
    if "inactive_days" in logic:
        reasons.append(f"Last purchase is older than {logic['inactive_days']} days")
    if "min_total_spent" in logic:
        reasons.append(f"Lifetime spend is at least INR {logic['min_total_spent']}")
    if "city" in logic:
        reasons.append(f"Customer city is {logic['city']}")
    if "top_percent" in logic:
        reasons.append(f"Customer is in the top {logic['top_percent']}% by lifetime spend")
    return reasons
