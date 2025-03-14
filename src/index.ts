import { Hono } from 'hono';
import { z } from 'zod';
import { serve } from "@hono/node-server";
import { HTTPException } from 'hono/http-exception';
const app = new Hono();
interface Movie {
    id: string;
    title: string;
    director: string;
    releaseYear: number;
    genre: string;
    ratings: number[];
  }
  const movies: Movie[] = [];
  const movieSchema = z.object({
    id: z.string(),
    title: z.string(),
    director: z.string(),
    releaseYear: z.number().int(),
    genre: z.string(),
  });
  const ratingSchema = z.object({
    rating: z.number().min(1).max(5),
  });
  // Add a new movie
  app.post('/movies', async (c) => {
    const body = await c.req.json();
    const parsed = movieSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid movie data' });
    }
    const newMovie: Movie = {
      id: parsed.data.id,
      title: parsed.data.title,
      director: parsed.data.director,
      releaseYear: parsed.data.releaseYear,
      genre: parsed.data.genre,
      ratings: []
    };
    movies.push(newMovie);
    return c.json({ message: 'Movie added successfully' }, 201);
  });
  // Update an existing movie
  app.patch('/movies/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const movie = movies.find((m) => m.id === id);
    if (!movie) {
      throw new HTTPException(404, { message: 'Movie not found' });
    }
    Object.assign(movie, body);
    return c.json({ message: 'Movie updated successfully' });
  });
  // Get movie details
  app.get('/movies/:id', (c) => {
    const id = c.req.param('id');
    const movie = movies.find((m) => m.id === id);
    if (!movie) {
      throw new HTTPException(404, { message: 'Movie not found' });
    }
    return c.json(movie);
  });
  // Delete a movie
  app.delete('/movies/:id', (c) => {
    const id = c.req.param('id');
    const index = movies.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new HTTPException(404, { message: 'Movie not found' });
    }
    movies.splice(index, 1);
    return c.json({ message: 'Movie deleted successfully' });
  });
  // Rate a movie
  app.post('/movies/:id/rating', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = ratingSchema.safeParse(body);
    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid rating value' });
    }
    const movie = movies.find((m) => m.id === id);
    if (!movie) {
      throw new HTTPException(404, { message: 'Movie not found' });
    }
    movie.ratings.push(parsed.data.rating);
    return c.json({ message: 'Rating added successfully' });
  });
  // Get average rating of a movie
  app.get('/movies/:id/rating', (c) => {
    const id = c.req.param('id');
    const movie = movies.find((m) => m.id === id);
    if (!movie) {
      throw new HTTPException(404, { message: 'Movie not found' });
    }
    if (movie.ratings.length === 0) {
        return c.newResponse('', { status: 204 });
    }
    const avgRating = movie.ratings.reduce((a, b) => a + b, 0) / movie.ratings.length;
    return c.json({ averageRating: avgRating });
  });
  // Get top-rated movies
  app.get('/movies/top-rated', (c) => {
    if (movies.length === 0) {
      throw new HTTPException(404, { message: 'No movies found' });
    }
    const sortedMovies = [...movies].sort((a, b) => {
      const avgA = a.ratings.length ? a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length : 0;
      const avgB = b.ratings.length ? b.ratings.reduce((x, y) => x + y, 0) / b.ratings.length : 0;
      return avgB - avgA;
    });
    return c.json(sortedMovies);
  });
  // Get movies by genre
  app.get('/movies/genre/:genre', (c) => {
    const genre = c.req.param('genre');
    const filteredMovies = movies.filter((m) => m.genre.toLowerCase() === genre.toLowerCase());
    if (filteredMovies.length === 0) {
      throw new HTTPException(404, { message: 'No movies found for this genre' });
    }
    return c.json(filteredMovies);
  });
  // Get movies by director
  app.get('/movies/director/:director', (c) => {
    const director = c.req.param('director');
    const filteredMovies = movies.filter((m) => m.director.toLowerCase() === director.toLowerCase());
    if (filteredMovies.length === 0) {
      throw new HTTPException(404, { message: 'No movies found by this director' });
    }
    return c.json(filteredMovies);
  });
  // Search movies by keyword in title
  app.get('/movies/search', (c) => {
    const keyword = c.req.query('keyword') || '';
    const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(keyword.toLowerCase()));
    if (filteredMovies.length === 0) {
      throw new HTTPException(404, { message: 'No movies found with this keyword' });
    }
    return c.json(filteredMovies);
  });
serve({ fetch: app.fetch, port: 3000 });
console.log(" Server running at http://localhost:3000");