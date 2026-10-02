import { maxCoverage, activitiesForFullCoverage } from '@tea/core';

export default function Home() {
  const people = 60;
  const activities = [8, 5, 10, 6];
  const coverage = Math.round(maxCoverage(people, activities) * 100);

  return (
    <main style={{ maxWidth: '34rem', margin: '0 auto', padding: '3rem 1.5rem', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
        Teambuilding Engagement App
      </h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
        Scaffold verified. Brand tokens and the first screens come next — see{' '}
        <code>docs/14-build-plan.md</code>.
      </p>

      <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Coverage forecast (live from core)</h2>
      <p>
        {people} people across activities of {activities.join(', ')} —{' '}
        <strong>each person meets at most {coverage}% of the room.</strong>
      </p>
      <p style={{ opacity: 0.7 }}>
        At teams of 10 throughout, {activitiesForFullCoverage(people, 10)} activities would be
        needed for everyone to meet everyone.
      </p>
    </main>
  );
}
