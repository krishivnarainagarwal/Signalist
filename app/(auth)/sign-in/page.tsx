'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/actions/auth.actions';

const SignIn = () => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if (result.success) {
                router.push('/');
                return;
            }
            setError('root', { message: result.error || 'Sign in failed' });
        } catch (e) {
            console.error(e);
            setError('root', {
                message: e instanceof Error ? e.message : 'Sign in failed',
            });
        }
    };

    return (
        <>
            <h1 className="form-title">You’re back.</h1>
            <p className="mb-8 text-sm text-gray-500">Same desk. Same names.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="Email"
                    placeholder="you@email.com"
                    register={register}
                    error={errors.email}
                    validation={{ required: 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                {errors.root && (
                    <p className="text-sm text-red-500">{errors.root.message}</p>
                )}

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>

                <FooterLink text="New here?" linkText="Join in" href="/sign-up" />
            </form>
        </>
    );
};

export default SignIn;
