#!/bin/bash

# Variables
BRANCH="main" # Remplacez par la branche principale (par ex. "main" ou "master")
UPSTREAM_REPO="https://github.com/username/original-repo.git" # Remplacez par l'URL du dépôt original

# Assurez-vous d'être dans le répertoire du dépôt forké
echo "Vérification du répertoire..."
if [ ! -d ".git" ]; then
  echo "Erreur : Ce script doit être exécuté dans le répertoire d'un dépôt Git."
  exit 1
fi

# Ajoutez le dépôt original comme remote "upstream" (si ce n'est pas déjà fait)
echo "Ajout du dépôt original comme remote 'upstream' (si nécessaire)..."
git remote add upstream "$UPSTREAM_REPO" 2>/dev/null || echo "Le remote 'upstream' existe déjà."

# Récupérez les modifications du dépôt original
echo "Récupération des modifications du dépôt original..."
git fetch upstream

# Fusionnez les modifications dans votre branche principale
echo "Fusion des modifications dans la branche '$BRANCH'..."
git checkout "$BRANCH"
git merge upstream/"$BRANCH"

# Poussez les modifications vers votre fork
echo "Poussée des modifications vers votre fork..."
git push origin "$BRANCH"

echo "Synchronisation terminée avec succès."