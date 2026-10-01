import requests

def update_all(base_url, env_name):
    print(f"\n--- Updating team details on {env_name}: {base_url} ---")
    
    # Map project names and candidates
    employees = requests.get(f"{base_url}/employees/").json()
    emp_by_name = {e["name"]: e["id"] for e in employees}
    
    from seed_test_employees import CANDIDATES
    
    for c in CANDIDATES:
        c_name = c["name"]
        emp_id = emp_by_name.get(c_name)
        if not emp_id:
            print(f"Employee {c_name} not found!")
            continue
            
        emp_detail = requests.get(f"{base_url}/employees/{emp_id}").json()
        tms = emp_detail.get("team_memberships", [])
        
        proj_specs = {p["project_name"]: p for p in c["projects"]}
        
        updated_tms = []
        for tm in tms:
            p_name = tm.get("project", {}).get("name")
            spec = proj_specs.get(p_name)
            if spec:
                tm["cv_relevance"] = spec.get("cv_relevance")
                tm["reference_name"] = spec.get("reference_name")
                tm["reference_phone"] = spec.get("reference_phone")
                tm["role_summary"] = spec.get("role_summary")
                tm["role"] = spec.get("role", tm.get("role"))
                updated_tms.append(tm)
                print(f"  {c_name} -> {p_name}: set relevance & ref ({spec.get('reference_name')})")
        
        payload = {
            "name": emp_detail["name"],
            "title": emp_detail["title"],
            "company": emp_detail["company"],
            "image_url": emp_detail.get("image_url"),
            "email": emp_detail.get("email"),
            "phone": emp_detail.get("phone"),
            "bio": emp_detail.get("bio"),
            "languages": emp_detail.get("languages", []),
            "key_competencies": emp_detail.get("key_competencies", []),
            "team_memberships": updated_tms
        }
        
        res = requests.put(f"{base_url}/employees/{emp_id}", json=payload)
        if res.status_code != 200:
            print(f"Failed to update {c_name}: {res.status_code}")

if __name__ == "__main__":
    update_all("http://localhost:8001", "LOCAL")
    update_all("https://prosjektbank-backend-rmp63il3jq-lz.a.run.app", "CLOUD")
