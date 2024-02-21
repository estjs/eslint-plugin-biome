import Biome from './biome';

let biome
export async function createBiome() {
	if (!biome) {
		biome = await Biome.create();
	}
	return Promise.resolve(biome)
}

