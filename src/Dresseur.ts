import { Pokemon } from "./Pokemon";

export class Dresseur {
    id: number = 0; 
    nom: string;
    niveau: number;
    experience: number;
    pokemons: Pokemon[];

    constructor(nom: string, niveau: number = 1, experience: number = 0, pokemons: Pokemon[] = []) {
        this.nom = nom;
        this.niveau = niveau;
        this.experience = experience;
        this.pokemons = pokemons;
    }

    ajouterPokemon(pokemon: Pokemon): void {
        this.pokemons.push(pokemon);
    }

    soignerTous(): void {
        for (const p of this.pokemons) {
            p.soigner();
        }
    }

    gagnerExperience(quantite: number): void {
        this.experience = this.experience + quantite;

        while (this.experience >= 10) {
            this.experience = this.experience - 10;
            this.niveau = this.niveau + 1;
        }
    }

    pokemonAleatoire(): Pokemon | null {
        const vivants: Pokemon[] = [];
        for (const p of this.pokemons) {
            if (p.estVivant()) {
                vivants.push(p);
            }
        }

        if (vivants.length === 0) {
        return null;
        }

        const index = Math.floor(Math.random() * vivants.length);
        return vivants[index];
    }

    pokemonLePlusFort(): Pokemon | null {
        let meilleur: Pokemon | null = null;

        for (const p of this.pokemons) {
            if (p.estVivant() && (meilleur === null || p.pointsDeVie > meilleur.pointsDeVie)) {
                meilleur = p;
            }
        }

        return meilleur;
    }

    aUnPokemonVivant(): boolean {
        for (const p of this.pokemons) {
            if (p.estVivant()) {
                return true;
            }
        }
        return false;
    }
}