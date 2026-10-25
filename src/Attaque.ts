export class Attaque {
    nom: string;
    degats: number;
    limiteUsage: number;
    compteurUsage: number;

    constructor(nom: string, degats: number, limiteUsage: number, compteurUsage: number = 0) {
        this.nom = nom;
        this.degats = degats;
        this.limiteUsage = limiteUsage;
        this.compteurUsage = compteurUsage;
    }

    peutEtreUtilisee(): boolean {
        return this.compteurUsage < this.limiteUsage;
    }

    utiliser(): void {
        this.compteurUsage = this.compteurUsage + 1;
    }

    reinitialiser(): void {
        this.compteurUsage = 0;
    }

    afficher(): string {
        return `${this.nom} - Dégâts : ${this.degats} - Utilisations : ${this.compteurUsage}/${this.limiteUsage}`;
    }
}