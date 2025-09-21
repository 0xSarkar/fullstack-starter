import { Seed, SeedContext } from './index.js';

export const notesSeeds: Seed = {
  name: 'notes',
  description: 'Seed sample notes for development and testing',
  environments: ['development', 'test'],
  dependencies: ['users'], // Notes need users to exist first
  run: async (context: SeedContext) => {
    const { db } = context;

    // Get sample users to assign notes to
    const users = await db
      .selectFrom('users')
      .select(['id', 'email'])
      .where('active', '=', true)
      .limit(3)
      .execute();

    if (users.length === 0) {
      console.log('   ⚠️  No active users found, skipping notes seed');
      return;
    }

    // Ensure we have at least one user
    const user1 = users[0]!;
    const user2 = users[1] || user1;
    const user3 = users[2] || user1;

    const sampleNotes = [
      {
        title: 'Welcome to the App!',
        content: '<p>This is your first note. You can edit, delete, or create new notes using the interface.</p>',
        user_id: user1.id,
      },
      {
        title: 'Getting Started Guide',
        content: `<h2>Welcome to your notes app!</h2>
<p>Here are some things you can do:</p>
<ul>
<li><strong>Create</strong> new notes with the + button</li>
<li><strong>Edit</strong> notes by clicking on them</li>
<li><strong>Delete</strong> notes you no longer need</li>
<li><strong>Search</strong> through your notes</li>
<li><strong>Organize</strong> your thoughts</li>
</ul>
<h3>Tips:</h3>
<ul>
<li>Notes support rich text formatting</li>
<li>Use headers, lists, and emphasis to organize your content</li>
<li>Your notes are automatically saved</li>
</ul>`,
        user_id: user1.id,
      },
      {
        title: 'Meeting Notes - Project Kickoff',
        content: `<h1>Project Kickoff Meeting</h1>
<p><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}<br>
<strong>Attendees:</strong> Team leads, stakeholders</p>
<h2>Agenda</h2>
<ol>
<li>Project overview</li>
<li>Timeline discussion</li>
<li>Resource allocation</li>
<li>Next steps</li>
</ol>
<h2>Action Items</h2>
<ul>
<li>Set up development environment</li>
<li>Define API specifications</li>
<li>Create initial wireframes</li>
<li>Schedule weekly check-ins</li>
</ul>`,
        user_id: user2.id,
      },
      {
        title: 'Ideas & Inspiration',
        content: `<h1>Random Ideas 💡</h1>
<h2>App Features</h2>
<ul>
<li>Dark mode toggle</li>
<li>Note categories/tags</li>
<li>Export functionality</li>
<li>Collaboration features</li>
<li>Mobile app</li>
</ul>
<h2>Personal</h2>
<ul>
<li>Learn a new programming language</li>
<li>Start a side project</li>
<li>Read more technical books</li>
<li>Contribute to open source</li>
</ul>
<p><em>Remember: The best ideas come when you least expect them!</em></p>`,
        user_id: user3.id,
      },
      {
        title: 'Quick Notes',
        content: `<p>Just some quick thoughts:</p>
<ul>
<li>Need to update dependencies</li>
<li>Fix the responsive design on mobile</li>
<li>Add error handling for API calls</li>
<li>Implement user preferences</li>
<li>Set up automated backups</li>
</ul>`,
        user_id: user1.id,
      },
    ];

    for (const note of sampleNotes) {
      await db
        .insertInto('notes')
        .values({
          ...note,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .execute();
    }

    console.log(`   📝 Upserted ${sampleNotes.length} sample notes for ${users.length} users`);
  },
};