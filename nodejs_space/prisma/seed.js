"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seeding...');
    const flavorTagNames = [
        'smoky',
        'citrus',
        'oak',
        'vanilla',
        'spicy',
        'fruity',
        'herbal',
        'sweet',
        'dry',
        'smooth',
    ];
    console.log('Seeding flavor tags...');
    for (const name of flavorTagNames) {
        await prisma.flavortag.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log('Flavor tags seeded successfully.');
    const testEmail = 'john@doe.com';
    const testPassword = 'johndoe123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log('Seeding test admin account...');
    await prisma.user.upsert({
        where: { email: testEmail },
        update: {},
        create: {
            email: testEmail,
            password: hashedPassword,
            name: 'John Doe',
            experiencelevel: 'Serious',
            ageverified: true,
            ageverificationtimestamp: new Date(),
        },
    });
    console.log('Test admin account seeded successfully.');
    const badges = [
        {
            name: 'Palate Pioneer',
            description: 'Master the art of flavor recognition',
            imageurl: 'https://cdn.abacus.ai/images/783e178c-4efc-46d3-b379-8c9b35a21993.png',
            criteriajson: {
                type: 'unique_flavor_count',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
                target: 15,
            },
        },
        {
            name: 'Global Connoisseur',
            description: 'Taste spirits from around the world',
            imageurl: 'https://cdn.abacus.ai/images/c823ade4-363e-4c8c-9c84-c2265ac71c8a.png',
            criteriajson: {
                type: 'unique_region_count',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Spirit Aficionado',
            description: 'Experience diverse categories and styles',
            imageurl: 'https://cdn.abacus.ai/images/12a4a00c-931c-49e5-8172-9eab05bf8819.png',
            criteriajson: {
                type: 'unique_category_style_combinations',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Distillery Devotee',
            description: 'Explore exceptional craft distilleries',
            imageurl: 'https://cdn.abacus.ai/images/a9ef7441-73d2-4a54-8d72-a8af045704d2.png',
            criteriajson: {
                type: 'unique_distillery_count',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Cask Voyager',
            description: 'Sail through different aging and maturation styles',
            imageurl: 'https://cdn.abacus.ai/images/a626a077-e1e5-4d23-a11c-2714a50aece6.jpg',
            criteriajson: {
                type: 'unique_maturation_styles',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Proof Explorer',
            description: 'Discover the full range of strengths',
            imageurl: 'https://cdn.abacus.ai/images/f3bc005e-11ad-46bd-bf22-b7616235237c.jpg',
            criteriajson: {
                type: 'unique_proof_bands',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Botanical Adventurer',
            description: 'Uncover the world of infused and flavored spirits',
            imageurl: 'https://cdn.abacus.ai/images/e9eede17-94c8-4d2f-81e4-b7706ea5f782.jpg',
            criteriajson: {
                type: 'unique_botanical_families',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Heritage Hunter',
            description: 'Honor the traditions of classic spirit origins',
            imageurl: 'https://cdn.abacus.ai/images/c92a7c7c-3d87-4db8-9468-1919451405b3.jpg',
            criteriajson: {
                type: 'unique_heritage_categories',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Contrast Connoisseur',
            description: 'Embrace opposites in one session',
            imageurl: 'https://cdn.abacus.ai/images/ad2146d0-68e3-4143-8ba3-47ac3f78e42e.jpg',
            criteriajson: {
                type: 'contrast_sessions',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
            },
        },
        {
            name: 'Underdog Champion',
            description: 'Celebrate the overlooked and emerging',
            imageurl: 'https://cdn.abacus.ai/images/ce4d3ebe-467f-432a-9552-4123ca87a253.jpg',
            criteriajson: {
                type: 'underdog_high_ratings',
                thresholds: { bronze: 5, silver: 10, gold: 15 },
                minRating: 4.3,
            },
        },
    ];
    console.log('Seeding badges...');
    for (const badge of badges) {
        await prisma.badge.upsert({
            where: { name: badge.name },
            update: badge,
            create: badge,
        });
    }
    console.log('Badges seeded successfully.');
    console.log('Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map