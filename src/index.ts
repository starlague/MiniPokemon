import express, { Request, Response, NextFunction } from "express";
import pool from "./db";
import { Attaque } from "./Attaque";
import { Pokemon } from "./Pokemon";
import { Dresseur } from "./Dresseur";
import {
  defiAleatoire,
  defiDeterministe,
  areneAleatoire,
  areneDeterministe,
} from "./combats";

const app = express();
app.use(express.json()); 


async function chargerPokemon(id: number): Promise<Pokemon | null> {
    const resultat = await pool.query("SELECT * FROM pokemons WHERE id = $1", [id]);
    if (resultat.rows.length === 0) {
        return null;
    }
    const ligne = resultat.rows[0];

    const resultatAttaques = await pool.query(
        `SELECT a.nom, a.degats, a.limite_usage, pa.compteur_usage
        FROM pokemon_attaques pa
        JOIN attaques a ON a.id = pa.attaque_id
        WHERE pa.pokemon_id = $1`,
        [id]
    );

    const attaques: Attaque[] = [];
    for (const a of resultatAttaques.rows) {
        attaques.push(new Attaque(a.nom, a.degats, a.limite_usage, a.compteur_usage));
    }

    const pokemon = new Pokemon(ligne.nom, ligne.points_de_vie, ligne.points_de_vie_max, attaques);
    pokemon.id = ligne.id;
    return pokemon;
}

async function sauvegarderPokemon(pokemon: Pokemon) {
    await pool.query("UPDATE pokemons SET points_de_vie = $1 WHERE id = $2", [
        pokemon.pointsDeVie,
        pokemon.id,
    ]);

    for (const attaque of pokemon.attaques) {
        await pool.query(
            `UPDATE pokemon_attaques
            SET compteur_usage = $1
            WHERE pokemon_id = $2
            AND attaque_id = (SELECT id FROM attaques WHERE nom = $3)`,
            [attaque.compteurUsage, pokemon.id, attaque.nom]
        );
    }
}

app.post("/pokemons", async (req: Request, res: Response) => {
    const nom = req.body.nom;
    const pointsDeVie = req.body.pointsDeVie;

    if (!nom || !pointsDeVie) {
        res.status(400).json({ erreur: "nom et pointsDeVie sont obligatoires" });
        return;
    }

    const resultat = await pool.query(
        "INSERT INTO pokemons (nom, points_de_vie, points_de_vie_max) VALUES ($1, $2, $2) RETURNING *",
        [nom, pointsDeVie]
    );
    res.status(201).json(resultat.rows[0]);
});

app.get("/pokemons/:id", async (req: Request, res: Response) => {
    const pokemon = await chargerPokemon(Number(req.params.id));

    if (pokemon === null) {
        res.status(404).json({ erreur: "Pokémon introuvable" });
        return;
    }

    res.json(pokemon);
});

app.post("/pokemons/:id/attaques", async (req: Request, res: Response) => {
    const pokemon = await chargerPokemon(Number(req.params.id));
    if (pokemon === null) {
        res.status(404).json({ erreur: "Pokémon introuvable" });
        return;
    }

    const resultatAttaque = await pool.query("SELECT * FROM attaques WHERE id = $1", [
        req.body.attaqueId,
    ]);
    if (resultatAttaque.rows.length === 0) {
        res.status(404).json({ erreur: "Attaque introuvable" });
        return;
    }
    const ligne = resultatAttaque.rows[0];
    const attaque = new Attaque(ligne.nom, ligne.degats, ligne.limite_usage);

    try {
        pokemon.apprendreAttaque(attaque);
    } catch (erreur) {
        res.status(400).json({ erreur: (erreur as Error).message });
        return;
    }

    await pool.query(
        "INSERT INTO pokemon_attaques (pokemon_id, attaque_id) VALUES ($1, $2)",
        [pokemon.id, ligne.id]
    );
    res.json(pokemon);
});

app.post("/pokemons/:id/soigner", async (req: Request, res: Response) => {
    const pokemon = await chargerPokemon(Number(req.params.id));
    if (pokemon === null) {
        res.status(404).json({ erreur: "Pokémon introuvable" });
        return;
    }

    pokemon.soigner();
    await sauvegarderPokemon(pokemon);
    res.json(pokemon);
});


async function chargerDresseur(id: number): Promise<Dresseur | null> {
    const resultat = await pool.query("SELECT * FROM dresseurs WHERE id = $1", [id]);
    if (resultat.rows.length === 0) {
        return null;
    }
    const ligne = resultat.rows[0];

    const resultatPokemons = await pool.query(
        "SELECT id FROM pokemons WHERE dresseur_id = $1 ORDER BY id",
        [id]
    );

    const pokemons: Pokemon[] = [];
    for (const p of resultatPokemons.rows) {
        const pokemon = await chargerPokemon(p.id);
        if (pokemon !== null) {
        pokemons.push(pokemon);
        }
    }

    const dresseur = new Dresseur(ligne.nom, ligne.niveau, ligne.experience, pokemons);
    dresseur.id = ligne.id;
    return dresseur;
}

async function sauvegarderDresseur(dresseur: Dresseur) {
    await pool.query(
        "UPDATE dresseurs SET niveau = $1, experience = $2 WHERE id = $3",
        [dresseur.niveau, dresseur.experience, dresseur.id]
    );

    for (const pokemon of dresseur.pokemons) {
        await sauvegarderPokemon(pokemon);
    }
}

app.post("/dresseurs", async (req: Request, res: Response) => {
    const nom = req.body.nom;

    if (!nom) {
        res.status(400).json({ erreur: "nom est obligatoire" });
        return;
    }

    const resultat = await pool.query(
        "INSERT INTO dresseurs (nom) VALUES ($1) RETURNING *",
        [nom]
    );
    res.status(201).json(resultat.rows[0]);
});

app.get("/dresseurs/:id", async (req: Request, res: Response) => {
    const dresseur = await chargerDresseur(Number(req.params.id));

    if (dresseur === null) {
        res.status(404).json({ erreur: "Dresseur introuvable" });
        return;
    }

    res.json(dresseur);
});

app.post("/dresseurs/:id/pokemons", async (req: Request, res: Response) => {
    const dresseurId = Number(req.params.id);
    const pokemonId = Number(req.body.pokemonId);

    const dresseur = await chargerDresseur(dresseurId);
    if (dresseur === null) {
        res.status(404).json({ erreur: "Dresseur introuvable" });
        return;
    }

    const pokemon = await chargerPokemon(pokemonId);
    if (pokemon === null) {
        res.status(404).json({ erreur: "Pokémon introuvable" });
        return;
    }

    await pool.query("UPDATE pokemons SET dresseur_id = $1 WHERE id = $2", [
        dresseurId,
        pokemonId,
    ]);

    dresseur.ajouterPokemon(pokemon);
    res.json(dresseur);
});

app.post("/dresseurs/:id/soigner", async (req: Request, res: Response) => {
    const dresseur = await chargerDresseur(Number(req.params.id));
    if (dresseur === null) {
        res.status(404).json({ erreur: "Dresseur introuvable" });
        return;
    }

    dresseur.soignerTous();
    await sauvegarderDresseur(dresseur);
    res.json(dresseur);
});

app.post("/dresseurs/:id/experience", async (req: Request, res: Response) => {
    const dresseur = await chargerDresseur(Number(req.params.id));
    if (dresseur === null) {
        res.status(404).json({ erreur: "Dresseur introuvable" });
        return;
    }

    const quantite = Number(req.body.quantite);
    if (!quantite || quantite <= 0) {
        res.status(400).json({ erreur: "quantite doit être un nombre positif" });
        return;
    }

    dresseur.gagnerExperience(quantite);
    await sauvegarderDresseur(dresseur);
    res.json(dresseur);
});


async function lancerCombat(
    req: Request,
    res: Response,
    combat: (d1: Dresseur, d2: Dresseur) => Dresseur | null
) {
    const id1 = Number(req.body.dresseur1Id);
    const id2 = Number(req.body.dresseur2Id);

    if (id1 === id2) {
        res.status(400).json({ erreur: "Il faut deux dresseurs différents" });
        return;
    }

    const dresseur1 = await chargerDresseur(id1);
    const dresseur2 = await chargerDresseur(id2);
    if (dresseur1 === null || dresseur2 === null) {
        res.status(404).json({ erreur: "Dresseur introuvable" });
        return;
    }

    if (dresseur1.pokemons.length === 0 || dresseur2.pokemons.length === 0) {
        res.status(400).json({ erreur: "Chaque dresseur doit avoir au moins un Pokémon" });
        return;
    }

    const gagnant = combat(dresseur1, dresseur2);

    await sauvegarderDresseur(dresseur1);
    await sauvegarderDresseur(dresseur2);

    res.json({
        gagnant: gagnant === null ? "Égalité" : gagnant.nom,
        dresseur1: dresseur1,
        dresseur2: dresseur2,
    });
}

app.post("/combats/defi-aleatoire", async (req: Request, res: Response) => {
    await lancerCombat(req, res, defiAleatoire);
});

app.post("/combats/defi-deterministe", async (req: Request, res: Response) => {
    await lancerCombat(req, res, defiDeterministe);
});

app.post("/combats/arene-1", async (req: Request, res: Response) => {
    await lancerCombat(req, res, areneAleatoire);
});

app.post("/combats/arene-2", async (req: Request, res: Response) => {
    await lancerCombat(req, res, areneDeterministe);
});


app.use((erreur: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(erreur);
    res.status(500).json({ erreur: "Erreur serveur" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});