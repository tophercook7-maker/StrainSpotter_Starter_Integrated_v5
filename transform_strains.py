import json
import re

# Load the raw cannabis data
with open('cannabis_raw.json', 'r') as f:
    raw_strains = json.load(f)

# Function to create a URL-friendly ID
def create_id(name):
    name_str = str(name)  # Convert to string in case it's a number
    return re.sub(r'[^a-z0-9]+', '-', name_str.lower()).strip('-')

# Function to parse percentage from rating (estimate THC based on rating)
def estimate_thc(rating):
    if rating >= 4.5:
        return "20-28%"
    elif rating >= 4.0:
        return "15-22%"
    elif rating >= 3.5:
        return "12-18%"
    else:
        return "10-15%"

# Function to estimate indica/sativa ratio
def get_ratio(strain_type):
    if strain_type.lower() == 'indica':
        return {'sativa': 20, 'indica': 80}
    elif strain_type.lower() == 'sativa':
        return {'sativa': 80, 'indica': 20}
    else:  # hybrid
        return {'sativa': 50, 'indica': 50}

# Transform the data
transformed_strains = []

for strain in raw_strains:
    strain_name = str(strain.get('Strain', 'Unknown'))  # Convert to string
    strain_type = str(strain.get('Type', 'hybrid')).capitalize()
    rating = strain.get('Rating', 3.0)
    effects = strain.get('Effects', '').split(',') if strain.get('Effects') else []
    flavors = strain.get('Flavor', '').split(',') if strain.get('Flavor') else []
    description = str(strain.get('Description', 'No description available.'))
    
    # Get ratio
    ratio = get_ratio(strain.get('Type', 'hybrid'))
    
    # Create transformed strain object
    transformed_strain = {
        'id': create_id(strain_name),
        'displayName': strain_name,
        'aka': [strain_name.replace(' ', ''), strain_name.replace(' ', '-')],
        'type': strain_type,
        'sativa': ratio['sativa'],
        'indica': ratio['indica'],
        'thcPercent': estimate_thc(rating),
        'cbdPercent': '0.1-1%',
        'effects': [e.strip() for e in effects if e.strip()],
        'medicalUses': [],  # Will be inferred from effects
        'flavors': [f.strip() for f in flavors if f.strip()],
        'bestClimate': 'Temperate to warm',
        'difficulty': 'Moderate',
        'floweringTime': '8-10 weeks',
        'height': 'Medium',
        'yield': 'Medium to High',
        'seedSources': [
            {
                'name': 'Seedsman',
                'url': f'https://www.seedsman.com/en/search?q={strain_name.replace(" ", "+")}'
            },
            {
                'name': 'ILGM',
                'url': f'https://ilgm.com/search?q={strain_name.replace(" ", "+")}'
            }
        ],
        'description': description
    }
    
    # Infer medical uses from effects
    effect_to_medical = {
        'Relaxed': 'Stress',
        'Happy': 'Depression',
        'Euphoric': 'Depression',
        'Uplifted': 'Depression',
        'Creative': 'ADHD',
        'Energetic': 'Fatigue',
        'Focused': 'ADHD',
        'Sleepy': 'Insomnia',
        'Hungry': 'Appetite Loss',
        'Tingly': 'Pain',
        'Aroused': 'Low Libido'
    }
    
    medical_uses = set()
    for effect in transformed_strain['effects']:
        if effect in effect_to_medical:
            medical_uses.add(effect_to_medical[effect])
    
    # Add common medical uses based on type
    if strain_type == 'Indica':
        medical_uses.update(['Pain', 'Insomnia', 'Stress'])
    elif strain_type == 'Sativa':
        medical_uses.update(['Depression', 'Fatigue', 'ADHD'])
    else:  # Hybrid
        medical_uses.update(['Pain', 'Stress'])
    
    transformed_strain['medicalUses'] = list(medical_uses)
    
    transformed_strains.append(transformed_strain)

# Save the transformed data
with open('public/data/expanded-strains-full.json', 'w') as f:
    json.dump(transformed_strains, f, indent=2)

print(f"Successfully transformed {len(transformed_strains)} strains!")
print(f"Output saved to: public/data/expanded-strains-full.json")

# Also create a backup of the original
import shutil
shutil.copy('public/data/expanded-strains.json', 'public/data/expanded-strains-backup.json')
print("Original database backed up to: public/data/expanded-strains-backup.json")