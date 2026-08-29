export {};

declare global {
    type SignInFormData = {
        email: string;
        password: string;
    };

    type SignUpFormData = {
        fullName: string;
        email: string;
        password: string;
        country: string;
        investmentGoals: string;
        riskTolerance: string;
        preferredIndustry: string;
    };

    type WelcomeEmailData = {
        email: string;
        name: string;
        intro: string;
    };

    type FooterLinkProps = {
        text: string;
        linkText: string;
        href: string;
    };

    type Option = {
        value: string;
        label: string;
    };

    type FormInputProps = {
        name: string;
        label: string;
        placeholder: string;
        type?: string;
        register: any;
        error?: any;
        validation?: any;
        disabled?: boolean;
        value?: string;
    };

    type SelectFieldProps = {
        name: string;
        label: string;
        placeholder: string;
        options: Option[];
        control: any;
        error?: any;
        required?: boolean;
    };

    type CountrySelectProps = {
        name: string;
        label: string;
        control: any;
        error?: any;
        required?: boolean;
    };
    type User = {
        id: string;
        name: string;
        email: string;
    };
}