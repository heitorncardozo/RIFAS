-- 1. Create ALUNOS table
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    turma TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create RIFAS table
CREATE TABLE IF NOT EXISTS public.rifas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero INTEGER NOT NULL UNIQUE,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
    vendido BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create VENDAS table
CREATE TABLE IF NOT EXISTS public.vendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
    rifa_id UUID REFERENCES public.rifas(id) ON DELETE CASCADE NOT NULL,
    comprovante_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Public Access (Read-only for front-end)
CREATE POLICY "Allow public read on alunos" ON public.alunos FOR SELECT USING (true);
CREATE POLICY "Allow public read on rifas" ON public.rifas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on vendas" ON public.vendas FOR INSERT WITH CHECK (true);

-- 6. Policies for Admin Access (Everything)
CREATE POLICY "Allow all for authenticated users" ON public.alunos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.rifas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON public.vendas FOR ALL USING (auth.role() = 'authenticated');

-- 7. Trigger to allow updating rifas when selling
CREATE POLICY "Allow public update on rifas for selling" ON public.rifas 
FOR UPDATE USING (vendido = false) WITH CHECK (vendido = true);

-- 8. Seed RIFAS (1 to 1300)
-- Run this block only once to populate the numbers
DO $$
BEGIN
    FOR i IN 1..1300 LOOP
        INSERT INTO public.rifas (numero) VALUES (i)
        ON CONFLICT (numero) DO NOTHING;
    END LOOP;
END $$;
