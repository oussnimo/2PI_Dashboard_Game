# 🎮 Lancement du Jeu - 2PI Dashboard Game

## Prérequis
- Python installé
- Google Chrome

## Étapes à chaque nouveau quiz

### 1. Exporter le quiz depuis le Frontend
- Générer le quiz → Cliquer Export → Extraire le ZIP téléchargé

### 2. Copier le JSON
```
copy "%USERPROFILE%\Downloads\NOM_DOSSIER_ZIP_EXTRAIT\data\levels_data.json" "BackEnd\storage\app\games\game_2\data\levels_data.json" /Y
```

### 3. Lancer le serveur
```
cd BackEnd\storage\app\games\game_2
python -m http.server 8080
```

### 4. Ouvrir dans Chrome
```
http://localhost:8080
```
Faire Ctrl+Shift+R → Cliquer OK sur SCORM → Jouer !