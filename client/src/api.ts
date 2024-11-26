import API_URL from './config';

export const fetchEvents = async () => {
    const response = await fetch(`${API_URL}/api/event`);
    if (!response.ok) {
        throw new Error('Failed to fetch events');
    }
    return response.json();
}