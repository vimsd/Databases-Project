import axios from 'axios';

const API_URL = '/api';

export const getMovies = () => axios.get(`${API_URL}/movies`);
export const createMovie = (data) => axios.post(`${API_URL}/movies`, data); //
export const deleteMovie = (id) => axios.delete(`${API_URL}/movies/${id}`);