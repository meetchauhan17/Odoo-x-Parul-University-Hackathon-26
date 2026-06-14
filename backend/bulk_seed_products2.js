/**
 * bulk_seed_products2.js — Add 100 MORE products (batch 2)
 * Usage:
 *   node bulk_seed_products2.js                          ← local DB
 *   DATABASE_URL="<prod_url>" node bulk_seed_products2.js ← deployed DB
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORG_ID = '00000000-0000-0000-0000-000000000000';

async function main() {
  console.log('\n🌱  Adding 100 more products (Batch 2)…\n');

  // Fetch all existing categories
  const allCats = await prisma.productCategory.findMany({ where: { organizationId: ORG_ID } });
  const cats = {};
  for (const c of allCats) cats[c.name] = c;

  // Helper — skip if category missing
  const cat = (name) => {
    if (!cats[name]) throw new Error(`Category "${name}" not found — run bulk_seed.js first.`);
    return cats[name].id;
  };

  const productDefs = [
    // Hot Drinks — 8 more
    { name: 'Mocha',                   catName: 'Hot Drinks',    price: 135, tax: 5,  uom: 'cup'   },
    { name: 'Hazelnut Latte',          catName: 'Hot Drinks',    price: 145, tax: 5,  uom: 'cup'   },
    { name: 'Vanilla Latte',           catName: 'Hot Drinks',    price: 140, tax: 5,  uom: 'cup'   },
    { name: 'Chai Latte',              catName: 'Hot Drinks',    price: 130, tax: 5,  uom: 'cup'   },
    { name: 'Matcha Latte',            catName: 'Hot Drinks',    price: 160, tax: 5,  uom: 'cup'   },
    { name: 'Turmeric Cappuccino',     catName: 'Hot Drinks',    price: 150, tax: 5,  uom: 'cup'   },
    { name: 'Cardamom Coffee',         catName: 'Hot Drinks',    price: 125, tax: 5,  uom: 'cup'   },
    { name: 'Café Doppio',             catName: 'Hot Drinks',    price: 110, tax: 5,  uom: 'cup'   },

    // Cold Drinks — 7 more
    { name: 'Iced Matcha',             catName: 'Cold Drinks',   price: 170, tax: 5,  uom: 'glass' },
    { name: 'Iced Caramel Latte',      catName: 'Cold Drinks',   price: 175, tax: 5,  uom: 'glass' },
    { name: 'Blue Lagoon',             catName: 'Cold Drinks',   price: 150, tax: 5,  uom: 'glass' },
    { name: 'Rose Lemonade',           catName: 'Cold Drinks',   price: 130, tax: 5,  uom: 'glass' },
    { name: 'Cucumber Cooler',         catName: 'Cold Drinks',   price: 120, tax: 5,  uom: 'glass' },
    { name: 'Tamarind Soda',           catName: 'Cold Drinks',   price: 100, tax: 5,  uom: 'glass' },
    { name: 'Watermelon Lemonade',     catName: 'Cold Drinks',   price: 140, tax: 5,  uom: 'glass' },

    // Snacks — 7 more
    { name: 'Peri Peri Fries',         catName: 'Snacks',        price: 140, tax: 10, uom: 'plate' },
    { name: 'Loaded Nachos',           catName: 'Snacks',        price: 220, tax: 10, uom: 'plate' },
    { name: 'Mozzarella Sticks',       catName: 'Snacks',        price: 180, tax: 10, uom: 'plate' },
    { name: 'Garlic Bread',            catName: 'Snacks',        price: 100, tax: 5,  uom: 'plate' },
    { name: 'Pita with Hummus',        catName: 'Snacks',        price: 160, tax: 5,  uom: 'plate' },
    { name: 'Cheese Fries',            catName: 'Snacks',        price: 160, tax: 10, uom: 'plate' },
    { name: 'Crispy Corn',             catName: 'Snacks',        price: 130, tax: 10, uom: 'plate' },

    // Mains — 8 more
    { name: 'Butter Chicken',          catName: 'Mains',         price: 300, tax: 10, uom: 'plate' },
    { name: 'Dal Makhani',             catName: 'Mains',         price: 220, tax: 5,  uom: 'plate' },
    { name: 'Kadai Paneer',            catName: 'Mains',         price: 260, tax: 5,  uom: 'plate' },
    { name: 'Pav Bhaji',               catName: 'Mains',         price: 180, tax: 5,  uom: 'plate' },
    { name: 'Chole Bhature',           catName: 'Mains',         price: 200, tax: 5,  uom: 'plate' },
    { name: 'Masala Dosa',             catName: 'Mains',         price: 160, tax: 5,  uom: 'plate' },
    { name: 'Veg Noodles',             catName: 'Mains',         price: 190, tax: 5,  uom: 'plate' },
    { name: 'Egg Fried Rice',          catName: 'Mains',         price: 180, tax: 5,  uom: 'plate' },

    // Desserts — 7 more
    { name: 'Kulfi',                   catName: 'Desserts',      price: 100, tax: 0,  uom: 'piece' },
    { name: 'Rasmalai',                catName: 'Desserts',      price: 120, tax: 0,  uom: 'plate' },
    { name: 'Kheer',                   catName: 'Desserts',      price: 110, tax: 0,  uom: 'bowl'  },
    { name: 'Chocolate Mousse',        catName: 'Desserts',      price: 160, tax: 5,  uom: 'cup'   },
    { name: 'Panna Cotta',             catName: 'Desserts',      price: 150, tax: 5,  uom: 'cup'   },
    { name: 'Waffle',                  catName: 'Desserts',      price: 180, tax: 5,  uom: 'plate' },
    { name: 'Crème Brûlée',            catName: 'Desserts',      price: 190, tax: 5,  uom: 'cup'   },

    // Juices — 6 more
    { name: 'Pomegranate Juice',       catName: 'Juices',        price: 130, tax: 0,  uom: 'glass' },
    { name: 'Beetroot Juice',          catName: 'Juices',        price: 110, tax: 0,  uom: 'glass' },
    { name: 'Carrot Ginger Juice',     catName: 'Juices',        price: 110, tax: 0,  uom: 'glass' },
    { name: 'Kiwi Juice',              catName: 'Juices',        price: 120, tax: 0,  uom: 'glass' },
    { name: 'Guava Juice',             catName: 'Juices',        price: 100, tax: 0,  uom: 'glass' },
    { name: 'Coconut Water',           catName: 'Juices',        price: 90,  tax: 0,  uom: 'glass' },

    // Milkshakes — 5 more
    { name: 'Kitkat Shake',            catName: 'Milkshakes',    price: 180, tax: 5,  uom: 'glass' },
    { name: 'Caramel Shake',           catName: 'Milkshakes',    price: 170, tax: 5,  uom: 'glass' },
    { name: 'Peanut Butter Shake',     catName: 'Milkshakes',    price: 190, tax: 5,  uom: 'glass' },
    { name: 'Rose Shake',              catName: 'Milkshakes',    price: 160, tax: 5,  uom: 'glass' },
    { name: 'Saffron Shake',           catName: 'Milkshakes',    price: 200, tax: 5,  uom: 'glass' },

    // Salads — 5 more
    { name: 'Quinoa Salad',            catName: 'Salads',        price: 200, tax: 5,  uom: 'bowl'  },
    { name: 'Avocado Salad',           catName: 'Salads',        price: 220, tax: 5,  uom: 'bowl'  },
    { name: 'Chickpea Salad',          catName: 'Salads',        price: 180, tax: 5,  uom: 'bowl'  },
    { name: 'Watermelon Feta Salad',   catName: 'Salads',        price: 190, tax: 5,  uom: 'bowl'  },
    { name: 'Roasted Veggie Salad',    catName: 'Salads',        price: 170, tax: 5,  uom: 'bowl'  },

    // Soups — 5 more
    { name: 'Lentil Soup',             catName: 'Soups',         price: 130, tax: 5,  uom: 'bowl'  },
    { name: 'Pumpkin Soup',            catName: 'Soups',         price: 140, tax: 5,  uom: 'bowl'  },
    { name: 'Broccoli Soup',           catName: 'Soups',         price: 140, tax: 5,  uom: 'bowl'  },
    { name: 'Minestrone Soup',         catName: 'Soups',         price: 150, tax: 5,  uom: 'bowl'  },
    { name: 'Manchow Soup',            catName: 'Soups',         price: 130, tax: 5,  uom: 'bowl'  },

    // Starters — 6 more
    { name: 'Chilli Paneer',           catName: 'Starters',      price: 240, tax: 10, uom: 'plate' },
    { name: 'Hara Bhara Kebab',        catName: 'Starters',      price: 200, tax: 10, uom: 'plate' },
    { name: 'Tandoori Mushroom',       catName: 'Starters',      price: 220, tax: 10, uom: 'plate' },
    { name: 'Crispy Calamari',         catName: 'Starters',      price: 280, tax: 10, uom: 'plate' },
    { name: 'Dhokla',                  catName: 'Starters',      price: 120, tax: 5,  uom: 'plate' },
    { name: 'Dahi Puri',               catName: 'Starters',      price: 130, tax: 5,  uom: 'plate' },

    // Burgers — 5 more
    { name: 'BBQ Veggie Burger',       catName: 'Burgers',       price: 210, tax: 10, uom: 'piece' },
    { name: 'Spicy Jalapeño Burger',   catName: 'Burgers',       price: 240, tax: 10, uom: 'piece' },
    { name: 'Smash Burger',            catName: 'Burgers',       price: 260, tax: 10, uom: 'piece' },
    { name: 'Teriyaki Burger',         catName: 'Burgers',       price: 250, tax: 10, uom: 'piece' },
    { name: 'Breakfast Burger',        catName: 'Burgers',       price: 220, tax: 10, uom: 'piece' },

    // Pizza — 5 more
    { name: 'Pesto Veggie Pizza',      catName: 'Pizza',         price: 310, tax: 10, uom: 'piece' },
    { name: 'Four Cheese Pizza',       catName: 'Pizza',         price: 350, tax: 10, uom: 'piece' },
    { name: 'Mushroom & Olive Pizza',  catName: 'Pizza',         price: 320, tax: 10, uom: 'piece' },
    { name: 'Paneer Tikka Pizza',      catName: 'Pizza',         price: 340, tax: 10, uom: 'piece' },
    { name: 'Neapolitan Pizza',        catName: 'Pizza',         price: 360, tax: 10, uom: 'piece' },

    // Pasta — 5 more
    { name: 'Cacio e Pepe',            catName: 'Pasta',         price: 220, tax: 5,  uom: 'plate' },
    { name: 'Creamy Mushroom Pasta',   catName: 'Pasta',         price: 230, tax: 5,  uom: 'plate' },
    { name: 'Tomato Basil Pasta',      catName: 'Pasta',         price: 200, tax: 5,  uom: 'plate' },
    { name: 'Spinach Ricotta Pasta',   catName: 'Pasta',         price: 240, tax: 5,  uom: 'plate' },
    { name: 'Pasta Primavera',         catName: 'Pasta',         price: 210, tax: 5,  uom: 'plate' },

    // Rice Bowls — 5 more
    { name: 'Mushroom Biryani',        catName: 'Rice Bowls',    price: 210, tax: 5,  uom: 'bowl'  },
    { name: 'Schezwan Fried Rice',     catName: 'Rice Bowls',    price: 190, tax: 5,  uom: 'bowl'  },
    { name: 'Poke Bowl',               catName: 'Rice Bowls',    price: 260, tax: 5,  uom: 'bowl'  },
    { name: 'Korean Rice Bowl',        catName: 'Rice Bowls',    price: 250, tax: 5,  uom: 'bowl'  },
    { name: 'Coconut Rice',            catName: 'Rice Bowls',    price: 180, tax: 5,  uom: 'bowl'  },

    // Wraps & Rolls — 5 more
    { name: 'Egg Roll',                catName: 'Wraps & Rolls', price: 130, tax: 5,  uom: 'piece' },
    { name: 'Shawarma Wrap',           catName: 'Wraps & Rolls', price: 180, tax: 5,  uom: 'piece' },
    { name: 'Mexican Burrito',         catName: 'Wraps & Rolls', price: 200, tax: 5,  uom: 'piece' },
    { name: 'Grilled Veggie Wrap',     catName: 'Wraps & Rolls', price: 160, tax: 5,  uom: 'piece' },
    { name: 'Hummus Wrap',             catName: 'Wraps & Rolls', price: 170, tax: 5,  uom: 'piece' },

    // Bakery — 5 more
    { name: 'Chocolate Muffin',        catName: 'Bakery',        price: 110, tax: 0,  uom: 'piece' },
    { name: 'Almond Croissant',        catName: 'Bakery',        price: 120, tax: 0,  uom: 'piece' },
    { name: 'Carrot Cake',             catName: 'Bakery',        price: 130, tax: 0,  uom: 'slice' },
    { name: 'Lemon Tart',              catName: 'Bakery',        price: 140, tax: 0,  uom: 'piece' },
    { name: 'Focaccia Bread',          catName: 'Bakery',        price: 100, tax: 0,  uom: 'slice' },

    // Ice Cream — 5 more
    { name: 'Pistachio Ice Cream',     catName: 'Ice Cream',     price: 110, tax: 0,  uom: 'scoop' },
    { name: 'Butterscotch Ice Cream',  catName: 'Ice Cream',     price: 100, tax: 0,  uom: 'scoop' },
    { name: 'Mango Sorbet',            catName: 'Ice Cream',     price: 120, tax: 0,  uom: 'scoop' },
    { name: 'Cookies & Cream',         catName: 'Ice Cream',     price: 130, tax: 0,  uom: 'scoop' },
    { name: 'Ice Cream Sundae',        catName: 'Ice Cream',     price: 180, tax: 5,  uom: 'bowl'  },

    // Health Drinks — 5 more
    { name: 'Acai Smoothie Bowl',      catName: 'Health Drinks', price: 200, tax: 0,  uom: 'bowl'  },
    { name: 'Wheatgrass Shot',         catName: 'Health Drinks', price: 80,  tax: 0,  uom: 'shot'  },
    { name: 'Aloe Vera Drink',         catName: 'Health Drinks', price: 120, tax: 0,  uom: 'glass' },
    { name: 'Kombucha',                catName: 'Health Drinks', price: 150, tax: 0,  uom: 'glass' },
    { name: 'Chia Lemonade',           catName: 'Health Drinks', price: 140, tax: 0,  uom: 'glass' },

    // Beverages — 5 new
    { name: 'Ginger Lemon Tea',        catName: 'Beverages',     price: 80,  tax: 5,  uom: 'cup'   },
    { name: 'Hibiscus Iced Tea',       catName: 'Beverages',     price: 110, tax: 5,  uom: 'glass' },
    { name: 'Mint Lemonade',           catName: 'Beverages',     price: 100, tax: 5,  uom: 'glass' },
    { name: 'Jaljeera',                catName: 'Beverages',     price: 70,  tax: 0,  uom: 'glass' },
    { name: 'Buttermilk',              catName: 'Beverages',     price: 60,  tax: 0,  uom: 'glass' },

    // Specials — 4 more
    { name: 'Combo Meal C',            catName: 'Specials',      price: 399, tax: 5,  uom: 'set'   },
    { name: 'Family Feast Box',        catName: 'Specials',      price: 799, tax: 10, uom: 'set'   },
    { name: 'Date Night For Two',      catName: 'Specials',      price: 699, tax: 10, uom: 'set'   },
    { name: 'Kids Meal',               catName: 'Specials',      price: 199, tax: 5,  uom: 'set'   },
  ];

  let created = 0;
  let skipped = 0;
  for (const def of productDefs) {
    const categoryId = cat(def.catName);
    const exists = await prisma.product.findFirst({
      where: { name: def.name, organizationId: ORG_ID },
    });
    if (!exists) {
      await prisma.product.create({
        data: {
          name:          def.name,
          categoryId,
          price:         def.price,
          tax:           def.tax,
          unitOfMeasure: def.uom,
          showOnKds:     true,
          isActive:      true,
          organizationId: ORG_ID,
        },
      });
      created++;
    } else {
      skipped++;
    }
  }

  const total = await prisma.product.count({ where: { organizationId: ORG_ID } });
  console.log(`  ✅  Batch 2: ${created} new products created, ${skipped} already existed`);
  console.log(`  📦  Total products in DB: ${total}`);
  console.log('\n  🎉  Done!\n');
}

main()
  .catch((e) => { console.error('\n❌ Failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
