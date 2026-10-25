CREATE TABLE attaques (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) UNIQUE NOT NULL,
    degats INT NOT NULL,
    limite_usage INT NOT NULL
);
 
CREATE TABLE dresseurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    niveau INT DEFAULT 1,
    experience INT DEFAULT 0
);
 
CREATE TABLE pokemons (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    points_de_vie INT NOT NULL,
    points_de_vie_max INT NOT NULL,
    dresseur_id INT REFERENCES dresseurs(id)
);
 
CREATE TABLE pokemon_attaques (
    pokemon_id INT REFERENCES pokemons(id) ON DELETE CASCADE,
    attaque_id INT REFERENCES attaques(id),
    compteur_usage INT DEFAULT 0,
    PRIMARY KEY (pokemon_id, attaque_id)
);