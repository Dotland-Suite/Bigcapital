#!/bin/bash

# Vérifier si le script est exécuté dans un dépôt Git
if [ ! -d ".git" ]; then
  echo "Ce script doit être exécuté dans un dépôt Git."
  exit 1
fi

# Supprimer tous les tags locaux
echo "Suppression des tags locaux..."
git tag -l | xargs -n 1 git tag -d

# Supprimer tous les tags distants
echo "Suppression des tags distants..."
git tag -l | xargs -n 1 -I {} git push origin :refs/tags/{}

echo "Tous les tags locaux et distants ont été supprimés."