{
  description = "A Nix-flake-based development environment for command-server";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit system; config.allowUnfree = true; };
      });
    in
    {
      packages = forEachSupportedSystem
        ({ pkgs, ... }:
          let
            attrs = with builtins; fromJSON (readFile ./package.json);
            # FIXME: Add the reference to name/version from package.json
            # https://github.com/cab404/vscode-direnv/blob/fd242c19ef66db7f3e7ed2687a4a50d33af2957b/flake.nix#L26

          in
          {
            default = pkgs.mkYarnPackage {
              pname = with attrs; name;
              src = ./.;
              packageJson = ./package.json;
              yarnLock = ./yarn.lock;

              buildPhase = ''
                # yarn tries to create a .yarn file in $HOME. There's probably a
                # better way to fix this but setting HOME to TMPDIR works for now.
                export HOME="$TMPDIR"
                yarn --offline compile
                echo y | yarn --offline vsce package --yarn -o $pname.vsix
              '';

              installPhase = ''
                mkdir $out
                mv $pname.vsix $out
              '';

              distPhase = "true";

            };
          });

      devShells = forEachSupportedSystem
        ({ pkgs }: {
          default = pkgs.mkShell
            {
              packages = with pkgs;
                [ yarn ];
            };
        });
    };
}
