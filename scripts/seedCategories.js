import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/category.js';

dotenv.config();

const categories = [
  { name: 'Electronics', description: 'Electronic devices and gadgets' },
  { name: 'Fashion', description: 'Clothing, shoes, and accessories' },
  { name: 'Home', description: 'Home and garden products' },
  { name: 'Beauty', description: 'Beauty and personal care products' },
  { name: 'Sports', description: 'Sports and outdoor equipment' },
  { name: 'Toys', description: 'Toys and games for children' },
  { name: 'Books', description: 'Books and stationery' },
  { name: 'Food', description: 'Food and beverages' },
  { name: 'Automotive', description: 'Automotive parts and accessories' },
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check and create categories that don't exist
    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({ name: categoryData.name });
      if (!existingCategory) {
        await Category.create(categoryData);
        console.log(`✓ Created category: ${categoryData.name}`);
      } else {
        console.log(`- Category already exists: ${categoryData.name}`);
      }
    }

    console.log('\nCategories seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
