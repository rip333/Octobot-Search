import axios from "axios";
import { MerlinCard } from "./models/MerlinCard";
import { MerlinPack } from "./models/MerlinPack";
import { MerlinDeck, MerlinDecklist } from "./models/MerlinDeck";

const MERLIN_BASE_URL = "https://db.merlindumesnil.net/api/public";

const merlinAxios = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
});

export const fetchMerlinCard = async (cardCode: string): Promise<MerlinCard | null> => {
    try {
        const response = await merlinAxios.get(`${MERLIN_BASE_URL}/card/${cardCode}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Merlin card ${cardCode}:`, error);
        return null;
    }
};

export const fetchMerlinCards = async (packCode?: string): Promise<MerlinCard[]> => {
    try {
        const url = packCode ? `${MERLIN_BASE_URL}/cards/${packCode}` : `${MERLIN_BASE_URL}/cards/`;
        const response = await merlinAxios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching Merlin cards:", error);
        return [];
    }
};

export const fetchMerlinPacks = async (): Promise<MerlinPack[]> => {
    try {
        const response = await merlinAxios.get(`${MERLIN_BASE_URL}/packs/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching Merlin packs:", error);
        return [];
    }
};

export const fetchMerlinDecklist = async (decklistId: number): Promise<MerlinDecklist | null> => {
    try {
        const response = await merlinAxios.get(`${MERLIN_BASE_URL}/decklist/${decklistId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Merlin decklist ${decklistId}:`, error);
        return null;
    }
};

export const fetchMerlinPopularDecklists = async (): Promise<MerlinDecklist[]> => {
    try {
        const response = await merlinAxios.get(`${MERLIN_BASE_URL}/decklists/popular/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching Merlin popular decklists:", error);
        return [];
    }
};

export const fetchMerlinPublicDeck = async (deckId: number): Promise<MerlinDeck | null> => {
    try {
        const response = await merlinAxios.get(`${MERLIN_BASE_URL}/deck/${deckId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching Merlin deck ${deckId}:`, error);
        return null;
    }
};
