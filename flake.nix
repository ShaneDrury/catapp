{
  description = "Cat app";
  #inputs.nixpkgs.url = github:NixOS/nixpkgs/nixos-unstable;
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }: flake-utils.lib.eachDefaultSystem (
    system:
    let
      pkgs =
        import nixpkgs {
          inherit system;
        };

        inherit (pkgs) stdenv;

    in
    rec {
      devShell = with pkgs; mkShell {
        buildInputs = with pkgs; [
          yarn
          nodejs
        ];
      };
    }
  );
}
