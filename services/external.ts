import { FearGreedData } from "../types";

export const fetchFearAndGreedIndex = async (): Promise<FearGreedData | null> => {
    try {
        const response = await fetch('https://api.alternative.me/fng/?limit=1');
        const data = await response.json();
        if (data && data.data && data.data.length > 0) {
            return data.data[0];
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch Fear & Greed Index", error);
        return null;
    }
};
