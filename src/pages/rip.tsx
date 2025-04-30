import React from 'react';
import Link from 'next/link';

const Rip: React.FC = () => {
    return (
        <div style={{ width: "90%", display: "inline-block" }}>
            <div>
                <h3>Rip Britton Links:</h3>
                <ul>
                    <li>
                        <Link
                            href="https://drive.google.com/drive/folders/17cwUOAMOBPP1taTyVarPUKLGWOAoZK68"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Homebrew Content Google Drive Folder
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="https://marvelcdb.com/user/profile/21062/ripb3"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            MarvelCDB Profile
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="https://github.com/rip333/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Github Profile
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Rip;