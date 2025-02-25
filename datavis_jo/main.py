from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

# Charger les données
def load_sports_data():
    df = pd.read_csv("static/data/events.csv", sep=";")
    categories = {}

    for _, row in df.iterrows():
        category = row["category"]
        sport = row["sport"]
        event = row["event"]

        if category not in categories:
            categories[category] = {}

        if sport not in categories[category]:
            categories[category][sport] = {"events": []}

        categories[category][sport]["events"].append(event)

    # Trier les sports et les événements par ordre alphabétique
    for category in categories:
        categories[category] = dict(sorted(categories[category].items()))
        for sport in categories[category]:
            categories[category][sport]["events"].sort()

    return categories

# Charger les données des athlètes
def load_athletes_data():
    try:
        print("Tentative de lecture du fichier athletes.csv...")
        df = pd.read_csv("static/data/athletes.csv")
        print(f"Fichier lu avec succès. Colonnes trouvées : {df.columns.tolist()}")
        
        # Vérification des colonnes requises
        required_columns = ['name', 'country', 'sport']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"ATTENTION: Colonnes manquantes : {missing_columns}")
            # Création de colonnes factices si nécessaire
            for col in missing_columns:
                if col == 'name':
                    df['name'] = [f"Athlète {i+1}" for i in range(len(df))]
                elif col == 'country':
                    df['country'] = 'France'
                elif col == 'sport':
                    df['sport'] = 'Athlétisme'
        
        # Remplacer les valeurs NaN par des valeurs par défaut
        df = df.fillna({
            'name': 'Athlète inconnu',
            'country': 'Pays inconnu',
            'sport': 'Sport inconnu',
            'age': 0,
            'medals': 0,
            'n_sports': 1
        })
        
        # Conversion des types de données
        if 'age' in df.columns:
            df['age'] = df['age'].astype(int)
        if 'medals' in df.columns:
            df['medals'] = df['medals'].astype(int)
        if 'n_sports' in df.columns:
            df['n_sports'] = df['n_sports'].astype(int)
        
        # Conversion en dictionnaire
        data = df.to_dict(orient="records")
        print(f"Données converties en JSON : {len(data)} enregistrements")
        
        # Affichage d'un exemple de données
        if len(data) > 0:
            print("Exemple de données d'athlète:", data[0])
        
        return data
    except FileNotFoundError:
        print("Erreur: Le fichier athletes.csv n'a pas été trouvé dans static/data/")
        # Création de données de test
        test_data = [
            {"name": "Test Athlete 1", "country": "France", "sport": "Athlétisme", "age": 25, "medals": 2, "n_sports": 1},
            {"name": "Test Athlete 2", "country": "USA", "sport": "Natation", "age": 22, "medals": 3, "n_sports": 1},
            {"name": "Test Athlete 3", "country": "Japon", "sport": "Judo", "age": 28, "medals": 1, "n_sports": 1},
            {"name": "Test Athlete 4", "country": "Kenya", "sport": "Athlétisme", "age": 24, "medals": 0, "n_sports": 1},
            {"name": "Test Athlete 5", "country": "Chine", "sport": "Gymnastique", "age": 20, "medals": 4, "n_sports": 1}
        ]
        print("Utilisation des données de test à la place")
        print("Exemple de données de test:", test_data[0])
        return test_data
    except Exception as e:
        print(f"Erreur lors du chargement des athlètes: {str(e)}")
        return []

@app.route("/")
def home():
    categories = load_sports_data()

    first_three_sports = {}
    remaining_sports = {}

    for category, sports in categories.items():
        sorted_sports = sorted(sports.keys())  # Trier les sports par ordre alphabétique
        first_three_sports[category] = {sport: sports[sport] for sport in sorted_sports[:3]}
        remaining_sports[category] = {sport: sports[sport] for sport in sorted_sports[3:]}

    return render_template("filter_sport.html", first_three_sports=first_three_sports, remaining_sports=remaining_sports)

@app.route("/athletes-view")
def athletes_view():
    return render_template("athletes.html")

@app.route("/api/athletes")
def get_all_athletes():
    try:
        data = load_athletes_data()
        print(f"Données des athlètes chargées : {len(data)} athlètes trouvés")
        
        # Nettoyer les données avant la sérialisation JSON
        clean_data = []
        for athlete in data:
            clean_athlete = {}
            for key, value in athlete.items():
                if pd.isna(value):
                    if key in ['age', 'medals', 'n_sports']:
                        clean_athlete[key] = 0
                    else:
                        clean_athlete[key] = ''
                else:
                    if key in ['age', 'medals', 'n_sports']:
                        clean_athlete[key] = int(float(value))
                    else:
                        clean_athlete[key] = str(value)
            clean_data.append(clean_athlete)
        
        if len(clean_data) > 0:
            print("Structure du premier athlète après nettoyage:", clean_data[0])
        return jsonify(clean_data)
    except Exception as e:
        print(f"Erreur lors du chargement des athlètes : {str(e)}")
        return jsonify([])

@app.route("/api/athletes/<sport>/<event>")
def get_athletes_by_event(sport, event):
    try:
        # Charger les données des médaillés depuis le CSV
        df_medallists = pd.read_csv("static/data/medallists.csv")
        print(f"Recherche pour sport={sport}, event={event}")
        print(f"Colonnes disponibles : {df_medallists.columns.tolist()}")
        
        # Vérifier si les colonnes nécessaires existent
        required_columns = ['discipline', 'event', 'name', 'country', 'medal_type', 'medal_code']
        missing_columns = [col for col in required_columns if col not in df_medallists.columns]
        if missing_columns:
            raise ValueError(f"Colonnes manquantes dans le fichier CSV : {missing_columns}")
        
        # Filtrer les médaillés par discipline et événement
        medalists = df_medallists[
            (df_medallists['discipline'].str.lower() == sport.lower()) &
            (df_medallists['event'].str.lower() == event.lower())
        ]
        
        if len(medalists) == 0:
            print(f"Aucun médaillé trouvé pour {sport} - {event}")
            print(f"Disciplines disponibles : {df_medallists['discipline'].unique()}")
            print(f"Événements disponibles pour {sport} : {df_medallists[df_medallists['discipline'].str.lower() == sport.lower()]['event'].unique()}")
            return jsonify([]), 404
        
        # Trier par code de médaille et prendre les 4 premiers
        medalists = medalists.sort_values('medal_code').head(4)
        print(f"Nombre de médaillés trouvés : {len(medalists)}")
        
        # Convertir en liste de dictionnaires
        result = []
        for _, athlete in medalists.iterrows():
            athlete_dict = {
                'name': str(athlete.get('name', 'Nom inconnu')),
                'country': str(athlete.get('country', 'Pays inconnu')),
                'medal_type': str(athlete.get('medal_type', ''))
            }
            result.append(athlete_dict)
        
        # Compléter avec des données fictives si nécessaire
        while len(result) < 4:
            result.append({
                'name': 'À déterminer',
                'country': '-',
                'medal_type': ''
            })
        
        print(f"Résultats : {result}")
        return jsonify(result)
        
    except FileNotFoundError:
        print("Erreur : Fichier medallists.csv non trouvé")
        return jsonify({"error": "Données des médaillés non disponibles"}), 500
    except ValueError as ve:
        print(f"Erreur de validation : {str(ve)}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(f"Erreur inattendue : {str(e)}")
        return jsonify({"error": "Une erreur inattendue est survenue"}), 500

@app.route("/athlete_detail/<athlete_name>")
def athlete_detail(athlete_name):
    athletes = pd.read_csv("static/data/athletes.csv")
    me_all = pd.read_csv('static/data/medallists.csv')
    
    athlete_data = athletes[athletes["name"].str.lower() == athlete_name.lower()]
    
    if athlete_data.empty:
        return f"Athlète {athlete_name} non trouvé", 404
    
    athlete_row = athlete_data.iloc[0].copy()
    
    # Vérifier les médailles
    medaille = me_all[me_all["name"] == athlete_row["name"]]

    if medaille.empty:
        medal_counts = {}
        medal_events = {}
    else:
        medal_counts = medaille["medal_type"].value_counts().to_dict()
        medal_events = medaille["event"].value_counts().to_dict()
    
    nb_events = len(athlete_row['events'].split(','))
    birth_year = athlete_row['birth_date'].split('-')[0]
    athlete_row["disciplines"] = athlete_row["disciplines"].replace("[", "").replace("]", "").replace("'", "")
    
    return render_template(
        "athlete_detail.html",
        athlete=athlete_row[['name', 'gender', 'function', 'events', 'country', 'disciplines', 'philosophy']].to_dict(),
        medal_counts=medal_counts,
        nb_events=nb_events,
        birth_year=birth_year,
        medal_events=medal_events
    )

@app.route("/torch-route")
def torch_route():
    try:
        # Charger les données du parcours de la torche
        torch_data = pd.read_csv("static/data/torch_route.csv")
        
        # Convertir les données en format JSON pour le template
        route_data = torch_data.to_dict(orient='records')
        
        return render_template("torch_route.html", route_data=route_data)
    except FileNotFoundError:
        return "Données du parcours de la torche non disponibles", 404
    except Exception as e:
        print(f"Erreur lors du chargement des données de la torche : {str(e)}")
        return "Une erreur est survenue", 500

if __name__ == "__main__":
    app.run(debug=True)