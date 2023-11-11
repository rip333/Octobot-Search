import axios from "axios";

export const queryCerebro = async (searchQuery: string) => {
    try {
        return await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?${searchQuery}`);
    } catch (error) {
        console.error('Error fetching search results:', error);
    }
};