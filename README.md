# INCO CODE — Mobile IDE 📱

> **IDE mobile professionnel** pour Android, développé par **INCO BOY TECH**
> Version : `1.0.0 FREE`

---

## 🖼 Aperçu

```
┌─────────────────────────────┐
│  INCO CODE  ·  Mobile IDE   │
│  ─────────────────────────  │
│  📁 Mes Projets    + Nouveau │
│  ─────────────────────────  │
│  ⚡ MonApp          3 fichiers│
│  🌐 Portfolio       2 fichiers│
│  🐍 Scripts         1 fichier │
└─────────────────────────────┘
```

---

## ✨ Fonctionnalités

| Fonctionnalité          | Description                                    |
|-------------------------|------------------------------------------------|
| 🖊 Éditeur multi-fichiers | Syntax highlighting HTML/CSS/JS/TS/JSON/Python  |
| 📑 Onglets              | Plusieurs fichiers ouverts en simultané        |
| 👁 Live Preview          | Aperçu WebView en temps réel                  |
| 🖥 Console d'erreurs     | Capture de console.log / erreurs JS           |
| 💾 Auto-sauvegarde       | Sauvegarde automatique configurable           |
| 🗂 Gestionnaire projets  | Créer, éditer, supprimer, chercher            |
| ⭐ Favoris              | Marquer les projets importants                |
| 🖤 Terminal simulé       | Commandes ls, cat, info, stats...             |
| ⚙️ Paramètres           | Taille police, thèmes, auto-save...           |
| 🌐 Templates             | Projet Web (HTML/CSS/JS) préconstruit         |
| 📦 Stockage local        | AsyncStorage — fonctionne hors-ligne          |

---

## 🚀 Installation

### Prérequis

```bash
# Node.js 18+
node --version   # >= 18.0.0

# Java Development Kit 17
java -version    # openjdk 17

# Android Studio avec SDK Android 34
# → SDK Tools : Android SDK Platform-Tools, Android Emulator

# React Native CLI
npm install -g @react-native-community/cli
```

### Variables d'environnement (Android)

Ajoutez dans votre `~/.bashrc` ou `~/.zshrc` :

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Rechargez : `source ~/.bashrc`

---

### Installation du projet

```bash
# 1. Cloner le projet
git clone https://github.com/incoboytech/inco-code.git
cd INCO-CODE

# 2. Installer les dépendances
npm install

# 3. (Android) Accepter les licences SDK
yes | sdkmanager --licenses

# 4. Lancer le Metro bundler (dans un terminal dédié)
npm start

# 5. Dans un second terminal — lancer sur Android
npm run android
```

---

## 🏗 Build de production (APK)

```bash
# Générer le bundle JS
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Compiler l'APK debug
cd android
./gradlew assembleDebug

# APK produit dans :
# android/app/build/outputs/apk/debug/app-debug.apk

# Compiler l'APK release
./gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📂 Structure du projet

```
INCO-CODE/
├── App.tsx                    # Composant racine
├── index.js                   # Point d'entrée Android/iOS
├── package.json               # Dépendances
├── tsconfig.json              # Config TypeScript
├── metro.config.js            # Config Metro bundler
│
├── app/
│   ├── navigation/
│   │   └── index.tsx          # React Navigation stack
│   │
│   ├── screens/
│   │   ├── SplashScreen.tsx   # Écran de démarrage animé
│   │   ├── HomeScreen.tsx     # Dashboard / liste projets
│   │   ├── EditorScreen.tsx   # Éditeur de code principal
│   │   ├── PreviewScreen.tsx  # Live preview WebView
│   │   ├── SettingsScreen.tsx # Paramètres
│   │   └── TerminalScreen.tsx # Terminal simulé
│   │
│   ├── components/            # (Composants réutilisables)
│   │
│   ├── utils/
│   │   ├── store.ts           # State global Zustand
│   │   └── syntaxHighlight.ts # Moteur coloration syntaxique
│   │
│   ├── storage/
│   │   └── index.ts           # AsyncStorage CRUD complet
│   │
│   └── themes/
│       └── index.ts           # Couleurs, typo, espacements
│
└── android/
    ├── app/
    │   ├── build.gradle
    │   └── src/main/
    │       ├── AndroidManifest.xml
    │       ├── java/com/incoboytech/incocode/
    │       │   ├── MainActivity.kt
    │       │   └── MainApplication.kt
    │       └── res/values/
    │           ├── styles.xml
    │           └── colors.xml
    ├── build.gradle
    └── gradle.properties
```

---

## 🎨 Stack technique

| Technologie              | Usage                                |
|--------------------------|--------------------------------------|
| React Native 0.73        | Framework mobile Android             |
| TypeScript 5.0           | Typage statique                      |
| Zustand 4.5              | State management global              |
| React Navigation 6       | Navigation entre écrans              |
| AsyncStorage             | Persistance locale des données       |
| WebView                  | Live preview HTML/CSS/JS             |
| React Native Reanimated  | Animations fluides                   |
| Hermes Engine            | JS optimisé Android                  |

---

## ⌨️ Commandes Terminal intégré

| Commande       | Description                              |
|----------------|------------------------------------------|
| `help`         | Afficher toutes les commandes            |
| `ls`           | Lister les fichiers du projet            |
| `cat <fichier>`| Afficher le contenu d'un fichier         |
| `info`         | Informations du projet courant           |
| `stats`        | Statistiques (lignes, chars, langages)   |
| `count`        | Compter les lignes par fichier           |
| `echo <texte>` | Afficher du texte                        |
| `date`         | Date et heure actuelles                  |
| `pwd`          | Chemin du projet courant                 |
| `version`      | Version de l'IDE                         |
| `whoami`       | Utilisateur                              |
| `clear`        | Effacer le terminal                      |

---

## 🗒 Notes de développement

### Coloration syntaxique
Le moteur de highlight est **entièrement custom** (pas de dépendance `highlight.js` en runtime).
Il utilise des RegExp par langage et colore token par token dans des composants `<Text>` React Native.

Langages supportés : `HTML`, `CSS`, `JavaScript`, `TypeScript`, `JSON`, `Markdown`, `Python`, `TXT`

### Live Preview
La WebView reçoit le HTML généré dynamiquement en fusionnant tous les fichiers du projet :
- `*.html` → HTML de base
- `*.css` → injecté en `<style>` inline
- `*.js` → injecté en `<script>` inline
- Un intercepteur JS capture `console.log/error/warn` et les renvoie à React Native

### Auto-save
Le délai est configurable dans les paramètres (500ms → 5000ms).
Un `●` jaune s'affiche sur l'onglet quand le fichier a des changements non sauvegardés.

---

## 🛠 Dépannage

```bash
# Problème Metro / cache
npm start -- --reset-cache

# Problème Gradle
cd android && ./gradlew clean && cd ..
npm run android

# Problème de permissions Android
adb reverse tcp:8081 tcp:8081

# Régénérer les assets Android
npx react-native-asset

# Vérifier l'environnement
npx react-native doctor
```

---

## 📋 Roadmap (version payante)

- [ ] Authentification + cloud sync
- [ ] Export ZIP / Import ZIP
- [ ] Partage de projets
- [ ] Thèmes additionnels (Dracula, Nord, Monokai)
- [ ] Support Git intégré
- [ ] Extensions / plugins
- [ ] Compilation JavaScript en temps réel
- [ ] Débogueur intégré
- [ ] Snippets personnalisés
- [ ] Collaboration en temps réel

---

## 📄 Licence

```
INCO CODE v1.0.0 — FREE VERSION
Copyright © 2024 INCO BOY TECH
Tous droits réservés.
```

---

<div align="center">

**INCO CODE** · Mobile IDE · FREE VERSION

Made with ❤️ by **INCO BOY TECH**

`</>`

</div>
