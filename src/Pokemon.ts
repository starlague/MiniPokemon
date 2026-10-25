import { Attaque } from "./Attaque";

export class Pokemon {
    id: number = 0;
    nom: string;
    pointsDeVie: number;
    pointsDeVieMax: number;
    attaques: Attaque[];

    constructor(nom: string, pointsDeVie: number, pointsDeVieMax: number, attaques: Attaque[] = []) {
        this.nom = nom;
        this.pointsDeVie = pointsDeVie;
        this.pointsDeVieMax = pointsDeVieMax;
        this.attaques = attaques;
    }

    apprendreAttaque(attaque: Attaque): void {
        if (this.attaques.length >= 4) {
            throw new Error("Un Pokémon ne peut pas avoir plus de 4 attaques");
        }

        for (const a of this.attaques) {
            if (a.nom === attaque.nom) {
                throw new Error("Ce Pokémon connaît déjà cette attaque");
            }
        }

        this.attaques.push(attaque);
    }

    soigner(): void {
        this.pointsDeVie = this.pointsDeVieMax;
        for (const a of this.attaques) {
            a.reinitialiser();
        }
    }

    subirDegats(degats: number): void {
        this.pointsDeVie = this.pointsDeVie - degats;
        if (this.pointsDeVie < 0) {
            this.pointsDeVie = 0;
        }
    }

    estVivant(): boolean {
        return this.pointsDeVie > 0;
    }

    attaquer(cible: Pokemon): boolean {
        const disponibles: Attaque[] = [];
        for (const a of this.attaques) {
            if (a.peutEtreUtilisee()) {
                disponibles.push(a);
            }
        }

        if (disponibles.length === 0) {
            return false;
        }

        const index = Math.floor(Math.random() * disponibles.length);
        const choisie = disponibles[index];

        choisie.utiliser();
        cible.subirDegats(choisie.degats);
        console.log(`${this.nom} utilise ${choisie.nom} sur ${cible.nom} (PV restants : ${cible.pointsDeVie})`);
        return true;
    }
}