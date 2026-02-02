-- Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create enum for listing tags
CREATE TYPE public.listing_tag AS ENUM ('city_trip', 'beach', 'winter_holiday', 'ski_trip', 'adventure', 'romantic', 'family', 'business');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postal_code TEXT,
    country TEXT,
    avatar_url TEXT,
    verification_status verification_status DEFAULT 'pending',
    id_document_url TEXT,
    transactions_bought INTEGER DEFAULT 0,
    transactions_sold INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create listings table for flight tickets
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    destination_city TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    origin_city TEXT NOT NULL,
    origin_country TEXT NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    airline TEXT NOT NULL,
    flight_number TEXT,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    name_change_fee DECIMAL(10,2),
    ticket_count INTEGER DEFAULT 1 NOT NULL,
    destination_image_url TEXT,
    luggage_included BOOLEAN DEFAULT false,
    carry_on_included BOOLEAN DEFAULT true,
    meal_included BOOLEAN DEFAULT false,
    speedy_boarding BOOLEAN DEFAULT false,
    stopovers INTEGER DEFAULT 0,
    additional_notes TEXT,
    tags listing_tag[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create cart items table
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, listing_id)
);

-- Create purchases table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    stripe_payment_id TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create search history for recommendations
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    destination_city TEXT,
    destination_country TEXT,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON public.listings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Verified users can create listings" ON public.listings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = seller_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can update their own listings" ON public.listings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = seller_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Sellers can delete their own listings" ON public.listings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = seller_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- Cart items policies
CREATE POLICY "Users can view their own cart" ON public.cart_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = user_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add to their own cart" ON public.cart_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = user_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own cart" ON public.cart_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = user_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete from their own cart" ON public.cart_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = user_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- Purchases policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE (profiles.id = buyer_id OR profiles.id = seller_id)
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create purchases" ON public.purchases
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = buyer_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- Search history policies
CREATE POLICY "Users can view their own search history" ON public.search_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = user_id 
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add to their search history" ON public.search_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = user_id 
            AND profiles.user_id = auth.uid()
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();