"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTestDistilleries = seedTestDistilleries;
const client_1 = require("@prisma/client");
const dotenv = require("dotenv");
dotenv.config();
const prisma = new client_1.PrismaClient();
const testDistilleries = [
    {
        name: 'James Sedgwick Distillery',
        country: 'South Africa',
        region: 'Wellington, Western Cape',
        latitude: -33.6394,
        longitude: 19.0143,
        logo: 'https://i.ytimg.com/vi/d3ZOQsFeCyc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBdbGRMyckbRniBaqG5pYyJgtdzLw',
        heroimage: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgYKybSOCjKk2GH3lSi2KAHOoFrgxgtqSttbEvFmhYv5I46OqIUKEmlcrYgY_wxBgUESdATuivaKKSmf14OllwUNWcYeK_4aYmVLnMe4kLcPTdsQHH-_fZMpvVncxeelTkCRSfh6I3KWu90/s1600/James+Sedgwick%2527s+08.jpg',
        bio: 'Home of Three Ships Whisky, crafting world-class whisky since 1886 in the heart of South African wine country.',
        verified: false,
        isclaimed: false,
        ispremium: true,
        websiteurl: 'https://threeshipswhisky.com',
    },
    {
        name: 'Inverroche Distillery',
        country: 'South Africa',
        region: 'Still Bay, Western Cape',
        latitude: -34.3692,
        longitude: 21.4389,
        logo: 'https://placehold.co/1200x600/e2e8f0/1e293b?text=Logo_of_Inverroche_gin_distillery_from_Still_Bay__',
        bio: 'Award-winning gin distillery on the breathtaking Garden Route, using indigenous fynbos botanicals.',
        verified: false,
        isclaimed: false,
        ispremium: false,
        websiteurl: 'https://inverroche.co.za',
    },
    {
        name: 'Woodstock Gin',
        country: 'South Africa',
        region: 'Cape Town, Western Cape',
        latitude: -33.9249,
        longitude: 18.4241,
        logo: 'https://placehold.co/1200x600/e2e8f0/1e293b?text=Logo_of_a_small_batch_gin_distillery_located_in_Wo',
        bio: 'Small-batch gin distillery in Cape Town\'s vibrant Woodstock neighborhood.',
        verified: false,
        isclaimed: false,
        ispremium: true,
        websiteurl: 'https://woodstockgin.co.za',
    },
    {
        name: 'Distell - Oude Molen',
        country: 'South Africa',
        region: 'Stellenbosch, Western Cape',
        latitude: -33.9321,
        longitude: 18.8602,
        logo: 'https://placehold.co/1200x600/e2e8f0/1e293b?text=Logo_of_Distell__a_South_African_spirits_producer',
        bio: 'Leading South African spirits producer, home to Klipdrift, Viceroy, and more.',
        verified: false,
        isclaimed: false,
        ispremium: false,
    },
    {
        name: 'The Balvenie',
        country: 'Scotland',
        region: 'Dufftown, Speyside',
        latitude: 57.4492,
        longitude: -3.1324,
        logo: 'https://lh3.googleusercontent.com/gIoMHtexQQ7OXF1hvOLBSpuJZj9BzK_BYWveivBtMEUiNOo9BhOM2r6lagxA-S2riAGpE0dwntFtMbxu2wS47Vl8W5n0ZA=s750',
        heroimage: 'https://live.staticflickr.com/8328/8142555935_94e6b3cf11_b.jpg',
        bio: 'One of the few single malt Scotch whisky distilleries to grow its own barley and use traditional floor maltings.',
        verified: false,
        isclaimed: false,
        ispremium: true,
        websiteurl: 'https://thebalvenie.com',
    },
    {
        name: 'Jameson',
        country: 'Ireland',
        region: 'Cork',
        latitude: 51.8969,
        longitude: -8.4863,
        logo: 'https://upload.wikimedia.org/wikipedia/en/0/06/Jameson_Irish_Whiskey_logo.png',
        bio: 'The world\'s leading Irish whiskey, triple-distilled for exceptional smoothness since 1780.',
        verified: false,
        isclaimed: false,
        ispremium: false,
        websiteurl: 'https://jamesonwhiskey.com',
    },
    {
        name: 'Buffalo Trace',
        country: 'United States',
        region: 'Kentucky',
        latitude: 38.1937,
        longitude: -84.8947,
        logo: 'https://lh3.googleusercontent.com/61lEijtV0XpXKjaKxk-FIMcQhBNE7d2CQ2ydwoEXDLyt5p9AAISab9OLL6VcRt9xnSxhnsvDBgNR5EIo2Mu4Umyo9DBt=s750',
        bio: 'America\'s oldest continuously operating distillery, producing award-winning bourbon since 1773.',
        verified: false,
        isclaimed: false,
        ispremium: true,
        websiteurl: 'https://buffalotracedistillery.com',
    },
    {
        name: 'Hendrick\'s Gin',
        country: 'Scotland',
        region: 'Girvan, Ayrshire',
        latitude: 55.2447,
        longitude: -4.8531,
        logo: 'https://www.theginguild.com/wp-content/uploads/2018/01/hendricks-gin-logo.jpg',
        bio: 'Peculiarly delicious gin infused with cucumber and rose petals.',
        verified: false,
        isclaimed: false,
        ispremium: false,
        websiteurl: 'https://hendricksgin.com',
    },
    {
        name: 'Yamazaki',
        country: 'Japan',
        region: 'Osaka',
        latitude: 34.8950,
        longitude: 135.6787,
        logo: 'https://i.ytimg.com/vi/a9gG750XxGU/mqdefault.jpg',
        heroimage: 'https://placehold.co/1200x600/e2e8f0/1e293b?text=Photograph_of_the_Yamazaki_whisky_distillery_in_Os',
        bio: 'Japan\'s first and oldest malt whisky distillery, pioneering Japanese whisky since 1923.',
        verified: false,
        isclaimed: false,
        ispremium: true,
        websiteurl: 'https://yamazaki.suntory.com',
    },
    {
        name: 'Pernod Ricard',
        country: 'France',
        region: 'Paris',
        latitude: 48.8566,
        longitude: 2.3522,
        logo: 'https://i.ytimg.com/vi/BI2yu7vqlDo/hqdefault.jpg',
        bio: 'Global leader in premium spirits, home to Absolut Vodka, Chivas Regal, and more.',
        verified: false,
        isclaimed: false,
        ispremium: false,
    },
];
async function seedTestDistilleries() {
    console.log('🌍 Seeding test distilleries...');
    for (const distilleryData of testDistilleries) {
        const existing = await prisma.distillery.findFirst({
            where: { name: distilleryData.name },
        });
        if (existing) {
            await prisma.distillery.update({
                where: { id: existing.id },
                data: distilleryData,
            });
            console.log(`✅ Updated: ${distilleryData.name}`);
        }
        else {
            await prisma.distillery.create({
                data: distilleryData,
            });
            console.log(`✨ Created: ${distilleryData.name}`);
        }
    }
    const distilleries = await prisma.distillery.findMany({
        where: {
            name: { in: ['James Sedgwick Distillery', 'The Balvenie', 'Woodstock Gin'] },
        },
        include: { spirits: true },
    });
    const testUser = await prisma.user.findFirst({
        where: { email: 'john@doe.com' },
    });
    if (testUser && distilleries.length > 0) {
        console.log('\n📝 Creating test distillery pours for trending...');
        for (const distillery of distilleries) {
            if (distillery.spirits.length > 0) {
                const spirit = distillery.spirits[0];
                await prisma.pour.create({
                    data: {
                        userid: testUser.id,
                        spiritid: spirit.id,
                        distilleryid: distillery.id,
                        isdistillerypost: true,
                        isshared: true,
                        whyithit: `Official post from ${distillery.name}: We're thrilled to share this exceptional spirit with our community. Crafted with passion and precision!`,
                    },
                });
                console.log(`✅ Created distillery pour for: ${distillery.name}`);
            }
        }
    }
    console.log('\n🎉 Test distillery seeding complete!');
    console.log(`\n📍 Total distilleries with coordinates: ${testDistilleries.length}`);
    console.log(`🏆 Premium distilleries: ${testDistilleries.filter(d => d.ispremium).length}`);
    console.log(`🌟 Verified distilleries: ${testDistilleries.filter(d => d.verified).length}`);
    return testDistilleries.length;
}
if (require.main === module) {
    seedTestDistilleries()
        .catch((e) => {
        console.error(e);
        process.exit(1);
    })
        .finally(async () => {
        await prisma.$disconnect();
    });
}
//# sourceMappingURL=seed-test-distilleries.js.map