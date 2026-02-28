import axios from 'axios';

// base path will be proxied by vite server; allow override via env var
const API_URL = import.meta.env.VITE_API || '/api';

export const getMovies = () => axios.get(`${API_URL}/movies`);
export const createMovie = (data) => axios.post(`${API_URL}/movies`, data); //
export const deleteMovie = (id) => axios.delete(`${API_URL}/movies/${id}`);