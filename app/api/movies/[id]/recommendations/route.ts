import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const apiKey = process.env.TMDB_API_KEY;
        const { id } = await params;

        if (!apiKey) {
            return NextResponse.json(
                { message: "API Key manquante." },
                { status: 500 }
            );
        }

        const url = `${TMDB_BASE_URL}/movie/${id}/recommendations?language=fr-FR&page=1`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json;charset=utf-8'
            },
            cache: 'force-cache'
        });

        if (!response.ok) {
            throw new Error(`Erreur réseau TMDb`);
        }

        const data = await response.json();

        // Formater les données
        const recommendations = (data.results || []).slice(0, 4).map((m: any) => ({
            id: m.id,
            title: m.title,
            posterUrl: m.poster_path ? `${TMDB_IMAGE_BASE_URL}${m.poster_path}` : null,
            releaseDate: m.release_date,
            voteAverage: m.vote_average
        }));

        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ recommendations: [] });
    }
}
