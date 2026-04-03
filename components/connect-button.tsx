type ConnectButtonProps = {
  href: string;
  disabled?: boolean;
  label: string;
};

export function ConnectButton({ href, disabled, label }: ConnectButtonProps) {
  if (disabled) {
    return (
      <span aria-disabled="true" className="button button--disabled">
        {label}
      </span>
    );
  }

  return (
    <a className="button" href={href}>
      {label}
    </a>
  );
}
