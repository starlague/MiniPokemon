import { Pokemon } from "./Pokemon";
import { Dresseur } from "./Dresseur";

function combattre(p1: Pokemon, p2: Pokemon): Pokemon | null {
    while (true) {
        const a1 = p1.attaquer(p2);
        if (!p2.estVivant()) {
            return p1;
        }

        const a2 = p2.attaquer(p1);
        if (!p1.estVivant()) {
            return p2;
        }

        if (!a1 && !a2) {
        if (p1.pointsDeVie > p2.pointsDeVie) return p1;
        if (p2.pointsDeVie > p1.pointsDeVie) return p2;
        return null;
        }
    }
}

function comparerDresseurs(d1: Dresseur, d2: Dresseur): Dresseur | null {
    if (d1.niveau > d2.niveau) return d1;
    if (d2.niveau > d1.niveau) return d2;

    if (d1.experience > d2.experience) return d1;
    if (d2.experience > d1.experience) return d2;

    return null;
}

export function defiAleatoire(d1: Dresseur, d2: Dresseur): Dresseur | null {
    d1.soignerTous();
    d2.soignerTous();

    const p1 = d1.pokemonAleatoire();
    const p2 = d2.pokemonAleatoire();

    if (p1 === null || p2 === null) {
        return null;
    }

    const pokemonGagnant = combattre(p1, p2);

    if (pokemonGagnant === p1) {
        d1.gagnerExperience(1);
        return d1;
    }
    if (pokemonGagnant === p2) {
        d2.gagnerExperience(1);
        return d2;
    }
    return null;
}

export function defiDeterministe(d1: Dresseur, d2: Dresseur): Dresseur | null {
    const p1 = d1.pokemonLePlusFort();
    const p2 = d2.pokemonLePlusFort();

    if (p1 === null && p2 === null) return null;
    if (p1 === null) return d2;
    if (p2 === null) return d1;

    const pokemonGagnant = combattre(p1, p2);

    if (pokemonGagnant === p1) {
        d1.gagnerExperience(1);
        return d1;
    }
    if (pokemonGagnant === p2) {
        d2.gagnerExperience(1);
        return d2;
    }
    return null;
}

export function areneAleatoire(d1: Dresseur, d2: Dresseur): Dresseur | null {
    for (let i = 0; i < 100; i++) {
        defiAleatoire(d1, d2);
    }

    return comparerDresseurs(d1, d2);
}

export function areneDeterministe(d1: Dresseur, d2: Dresseur): Dresseur | null {
    for (let i = 0; i < 100; i++) {
        if (!d1.aUnPokemonVivant() || !d2.aUnPokemonVivant()) {
            break;
        }
        defiDeterministe(d1, d2);
    }

    if (!d1.aUnPokemonVivant() && d2.aUnPokemonVivant()) return d2;
    if (!d2.aUnPokemonVivant() && d1.aUnPokemonVivant()) return d1;

    return comparerDresseurs(d1, d2);
}
